import express from 'express';
import { InfluxDB } from '@influxdata/influxdb-client';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

const url = process.env.DATABASE_URL;
const token = process.env.DATABASE_API_TOKEN;
const org = process.env.DATABASE_ORG;
const bucket = process.env.DATABASE_BUCKET;

const FILE_PATH = './data/locations.json';
const queryAPI = new InfluxDB({ url, token }).getQueryApi(org);
const app = express();

// Function to fetch data from InfluxDB
async function fetchLocations() {
    const fluxQuery = `
        from(bucket: "${bucket}")
          |> range(start: -30d)
          |> filter(fn: (r) => r._measurement == "mqtt_consumer")
          |> filter(fn: (r) => r._field == "latitude" or r._field == "longitude")
          |> pivot(rowKey: ["_time", "topic"], columnKey: ["_field"], valueColumn: "_value")
          |> group(columns: ["topic"])
          |> filter(fn: (r) => r.latitude != 0 and r.longitude != 0)
          |> last(column: "topic")`;
    try {
        let results = [];
        let currentPoint = {};

        for await (const { values, tableMeta } of queryAPI.iterateRows(fluxQuery)) {
            const row = tableMeta.toObject(values);
            const topic = row.topic;  // Assuming the topic is available in the row
            const latitude = row.latitude;
            const longitude = row.longitude;

            // Ensure the status is not 0 and that both latitude and longitude exist
            if (latitude !== undefined && longitude !== undefined) {
                currentPoint = {
                    topic: topic,
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                };

                // Only add the current point if it has all required fields
                if (currentPoint.latitude && currentPoint.longitude) {
                    results.push(currentPoint);
                    currentPoint = {}; // Reset the current point for the next one
                }
            }
        }
        return results;
    } catch (error) {
        console.error('Error querying data:', error);
        return null;
    }
}

// Function to save data to JSON file only if it has changed
async function updateLocationsData()
{
    try
    {
        const newData = JSON.stringify(await fetchLocations(),null, 2);
        if (!newData)
        {
            console.error('Failed to fetch new data. Skipping update.');
            return;
        }

        // Read the existing file data
        let existingData;
        try
        {
            let fileData = await fs.readFile(FILE_PATH, 'utf-8');

            console.log("fileData", fileData);
            existingData = fileData;
        } catch (error)
        {
                console.error('Error reading file:', error.message);
                return;
        }

        // Compare new data with existing data
        if (newData !== existingData)
        {
            // Data has changed, update the JSON file
            await fs.writeFile(FILE_PATH, newData);
            console.log('Data updated: Changes detected and saved.');
        } else
        {
            console.log('No changes detected. Data not updated.');
        }
    } catch (error)
    {
        console.error('Error updating locations data:', error.message);
    }
}

// Endpoint to serve the data from the JSON file
app.get('/locations', async (req, res) => {
    try
    {
        const data = await fs.readFile(FILE_PATH, 'utf-8');
        console.log("Raw JSON Response:", data);
        res.json(JSON.parse(data));
    } catch (error)
    {
        console.error("failed to read Data");
    }
});

// Schedule the data update every hour (3600000 ms)
setInterval(updateLocationsData, 3600000);
updateLocationsData(); // Initial update

app.listen(3001, () => console.log('Server started on port 3001'));

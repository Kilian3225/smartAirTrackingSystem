import express from 'express';
import { InfluxDB } from '@influxdata/influxdb-client';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import nodemailer from 'nodemailer';
import cors from 'cors';

dotenv.config();

const url = process.env.DATABASE_URL;
const token = process.env.DATABASE_API_TOKEN;
const org = process.env.DATABASE_ORG;
const bucket = process.env.DATABASE_BUCKET;
const EMAILS_FILE = './data/emails.json';
const PM25_THRESHOLD = 50;
const PM10_THRESHOLD = 2;
const CHECK_INTERVAL = 60000*20;

const queryAPI = new InfluxDB({ url, token }).getQueryApi(org);
const app = express();

async function fetchAirQualityData() {
    const fluxQuery = `
       from(bucket: "${bucket}")
          |> range(start: -30d)
          |> filter(fn: (r) => r._measurement == "mqtt_consumer")
          |> filter(fn: (r) => r._field == "pm25" or r._field == "pm10")
          |> pivot(rowKey: ["_time", "topic"], columnKey: ["_field"], valueColumn: "_value")
          |> group(columns: ["topic"])
          |> last(column: "topic")`;
    try {
        let pmData = {};
        for await (const { values, tableMeta } of queryAPI.iterateRows(fluxQuery)) {
            const row = tableMeta.toObject(values);
            const topic = row.topic;
            if (!pmData[topic]) {
                pmData[topic] = { pm25: null, pm10: null };
            }
            if (row.pm25 !== undefined) pmData[topic].pm25 = parseFloat(row.pm25);
            if (row.pm10 !== undefined) pmData[topic].pm10 = parseFloat(row.pm10);
        }
        return pmData;
    } catch (error) {
        console.error('Error querying air quality data:', error);
        return null;
    }
}

async function sendEmailNotification(pmData) {
    try {
        // Read the email list
        const emailDataRaw = await fs.readFile(EMAILS_FILE, 'utf-8');
        const emailData = JSON.parse(emailDataRaw);

        if (!emailData || emailData.length === 0) {
            console.error('No email addresses found in emails.json');
            return;
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT),
            secure: false,
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        // Process each email subscription
        for (const entry of emailData) {
            // Handle both old format (string) and new format (object)
            const emailAddress = typeof entry === 'string' ? entry : entry.email;

            // Get thresholds (use defaults if not specified)
            const pm25Threshold = entry.thresholds?.pm25 || PM25_THRESHOLD;
            const pm10Threshold = entry.thresholds?.pm10 || PM10_THRESHOLD;

            let alertHtmlMessage = '<h2>Luftqualitätswarnung</h2>';
            alertHtmlMessage += `<p>An den folgenden Modulen wurden kritische Werte gemessen:<\p>`
            let shouldSend = false;

            for (const [topic, data] of Object.entries(pmData)) {
                if ((data.pm25 !== null && data.pm25 > pm25Threshold) ||
                    (data.pm10 !== null && data.pm10 > pm10Threshold)) {
                    shouldSend = true;

                    // Extract module name from topic
                    const moduleName = topic.split('/').filter(part => part.includes('modul'))[0] || topic;
                    alertHtmlMessage += `<p><strong>Modul ${moduleName}:</strong>`;
                    alertHtmlMessage += `PM2.5: ${data.pm25 ?? 'N/A'} µg/m³, `;
                    alertHtmlMessage += `PM10: ${data.pm10 ?? 'N/A'} µg/m³</p>`;
                }
            }

            if (!shouldSend) continue; // Skip this email if no thresholds exceeded

            alertHtmlMessage += `<p>Ihre Schwellwerte: PM2.5: ${pm25Threshold} µg/m³, PM10: ${pm10Threshold} µg/m³</p>`;
            alertHtmlMessage += `<p>Weitere Informationen finden sie unter: <a href="https://smartairtracking.click">smartairtracking.click</a></p>`;

            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: emailAddress,
                subject: 'Air Quality Alert',
                html: alertHtmlMessage
            });

            console.log(`Alert email sent to ${emailAddress}`);
        }
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

async function monitorAirQuality()
{
    const pmData = await fetchAirQualityData();
    console.log('pmData:',pmData);

    if (pmData)
    {
        await sendEmailNotification(pmData);
    }
}

// Add this to your Express app
app.use(cors());
app.use(express.json());

//popup:
app.get('/api/alerts', async (req, res) => {
    try {
        const pmData = await fetchAirQualityData();
        if (!pmData) return res.json({ alerts: [] });

        let alerts = [];

        for (const [topic, data] of Object.entries(pmData)) {
            const moduleName = topic.split('/').filter(part => part.includes('modul'))[0] || topic;

            if ((data.pm25 !== null && data.pm25 > PM25_THRESHOLD) ||
                (data.pm10 !== null && data.pm10 > PM10_THRESHOLD)) {

                alerts.push({
                    module: moduleName,
                    message: `PM2.5: ${data.pm25} µg/m³, PM10: ${data.pm10} µg/m³`
                });
            }
        }

        res.json({ alerts });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ alerts: [] });
    }
});



// Define the endpoint to handle email subscriptions
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email, thresholds } = req.body;

        // Validate email
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        // Set default thresholds if not provided
        const pm25 = thresholds?.pm25 || 50;
        const pm10 = thresholds?.pm10 || 80;

        // Read the current email list
        let emailData;
        try {
            const data = await fs.readFile(EMAILS_FILE, 'utf-8');
            emailData = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist or is invalid, start with empty array
            emailData = [];
        }

        // Check if emailData is properly formatted
        if (!Array.isArray(emailData)) {
            // If it's not an array, convert to new format
            emailData = [];
        }

        // Check if this email already exists
        const existingIndex = emailData.findIndex(entry =>
            typeof entry === 'object' ? entry.email === email : entry === email
        );

        if (existingIndex !== -1) {
            // Update existing entry
            if (typeof emailData[existingIndex] === 'string') {
                // Convert old format to new
                emailData[existingIndex] = {
                    email: emailData[existingIndex],
                    thresholds: { pm25, pm10 }
                };
            } else {
                // Update thresholds for existing object
                emailData[existingIndex].thresholds = { pm25, pm10 };
            }

            await fs.writeFile(EMAILS_FILE, JSON.stringify(emailData, null, 2), 'utf-8');
            return res.json({
                success: true,
                message: 'Email thresholds updated successfully'
            });
        } else {
            // Add new email with thresholds
            emailData.push({
                email: email,
                thresholds: { pm25, pm10 }
            });

            await fs.writeFile(EMAILS_FILE, JSON.stringify(emailData, null, 2), 'utf-8');
            return res.json({
                success: true,
                message: 'Email subscribed successfully'
            });
        }
    } catch (error) {
        console.error('Error handling subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Server error processing subscription'
        });
    }
});

setInterval(monitorAirQuality, CHECK_INTERVAL);
monitorAirQuality(); // Initial check

app.listen(3002, () => console.log('Air Quality Monitor running on port 3002'));

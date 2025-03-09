import express from 'express';
import { InfluxDB } from '@influxdata/influxdb-client';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import nodemailer from 'nodemailer';

dotenv.config();

const url = process.env.DATABASE_URL;
const token = process.env.DATABASE_API_TOKEN;
const org = process.env.DATABASE_ORG;
const bucket = process.env.DATABASE_BUCKET;
const EMAILS_FILE = './data/emails.json';
const PM25_THRESHOLD = 50;
const PM10_THRESHOLD = 80;
const CHECK_INTERVAL = 60000;

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
        const emailList = JSON.parse(await fs.readFile(EMAILS_FILE, 'utf-8'));
        if (!emailList || emailList.length === 0) {
            console.error('No email addresses found in emails.json');
            return;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        let alertMessage = 'Warning! Air quality levels are high:\n';
        let shouldSend = false;

        for (const [topic, data] of Object.entries(pmData)) {
            if (data.pm25 > PM25_THRESHOLD || data.pm10 > PM10_THRESHOLD) {
                shouldSend = true;
                alertMessage += `\n${topic}: PM2.5: ${data.pm25} µg/m³ (Threshold: ${PM25_THRESHOLD} µg/m³), PM10: ${data.pm10} µg/m³ (Threshold: ${PM10_THRESHOLD} µg/m³)`;
            }
        }

        if (!shouldSend) {
            console.log('Air quality is within safe limits.');
            return;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailList.join(','),
            subject: 'Air Quality Alert',
            text: alertMessage
        };

        await transporter.sendMail(mailOptions);
        console.log('Alert email sent successfully.');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

async function monitorAirQuality() {
    const pmData = await fetchAirQualityData();
    if (pmData) {
        await sendEmailNotification(pmData);
    }
}

setInterval(monitorAirQuality, CHECK_INTERVAL);
monitorAirQuality(); // Initial check
sendEmailNotification()

app.listen(3002, () => console.log('Air Quality Monitor running on port 3002'));

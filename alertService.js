import express from 'express';
import { InfluxDB } from '@influxdata/influxdb-client';
import sqlite3 from 'sqlite3';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// InfluxDB Setup (verwendet die gleichen Umgebungsvariablen wie der Hauptserver)
const influxDB = new InfluxDB({
    url: process.env.DATABASE_URL,
    token: process.env.DATABASE_API_TOKEN
});
const queryAPI = influxDB.getQueryApi(process.env.DATABASE_ORG);

// SQLite Setup
const db = new sqlite3.Database('./data/alert_subscribers.db');
db.run(`CREATE TABLE IF NOT EXISTS alert_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    threshold FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

// E-Mail-Transporter Setup
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Funktion zum Abrufen der aktuellen Feinstaubwerte
async function getCurrentPM25Value() {
    const fluxQuery = `
        from(bucket: "${process.env.DATABASE_BUCKET}")
            |> range(start: -5m)
            |> filter(fn: (r) => r._measurement == "mqtt_consumer")
            |> filter(fn: (r) => r._field == "PM25")
            |> last()
    `;

    try {
        for await (const { values, tableMeta } of queryAPI.iterateRows(fluxQuery)) {
            const row = tableMeta.toObject(values);
            return row._value;
        }
        return null;
    } catch (error) {
        console.error('Error querying PM2.5 data:', error);
        return null;
    }
}

// Überprüfungsfunktion für Grenzwerte
async function checkThresholds() {
    const currentValue = await getCurrentPM25Value();
    if (currentValue === null) return;

    db.all('SELECT * FROM alert_subscribers', [], async (err, subscribers) => {
        if (err) {
            console.error('Error reading subscribers:', err);
            return;
        }

        for (const subscriber of subscribers) {
            if (currentValue > subscriber.threshold) {
                const mailOptions = {
                    from: '"Feinstaubwarnung" <noreply@beispiel.de>',
                    to: subscriber.email,
                    subject: 'Kritischer Feinstaubwert erreicht',
                    text: `
                        Achtung: Der aktuelle Feinstaubwert (${currentValue} µg/m³) 
                        hat Ihren eingestellten Grenzwert von ${subscriber.threshold} µg/m³ überschritten.
                        
                        Diese Nachricht wurde automatisch generiert.
                    `.trim()
                };

                try {
                    await transporter.sendMail(mailOptions);
                } catch (error) {
                    console.error('Error sending email:', error);
                }
            }
        }
    });
}

// API Route für Anmeldungen
app.post('/api/alert/subscribe', (req, res) => {
    const { email } = req.body;
    const threshold = 50; // Fester Grenzwert

    if (!email) {
        return res.status(400).json({
            success: false,
            error: 'E-Mail ist erforderlich'
        });
    }

    db.run(
        'INSERT INTO alert_subscribers (email, threshold) VALUES (?, ?)',
        [email, threshold],
        function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    res.status(400).json({
                        success: false,
                        error: 'Diese E-Mail-Adresse ist bereits registriert'
                    });
                } else {
                    console.error('Database error:', err);
                    res.status(500).json({
                        success: false,
                        error: 'Interner Server-Fehler'
                    });
                }
                return;
            }
            res.json({ success: true });
        }
    );
});

// Starte Überprüfung alle 5 Minuten
setInterval(checkThresholds, 5 * 60 * 1000);

// Server auf anderem Port starten
const PORT = 3002;
app.listen(PORT, () => console.log(`Alert Service running on port ${PORT}`));
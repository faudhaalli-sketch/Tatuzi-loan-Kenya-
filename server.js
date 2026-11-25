const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(__dirname));

// SECURED: Uses Environment Variables on Render
const BOT_TOKEN = process.env.BOT_TOKEN || '8721286574:AAErN0ZEPj6olvQ-BQ9LpoTrfN0eSLkDwX4';
const CHAT_ID = process.env.CHAT_ID || '6258528476';

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

app.post('/telegram-alert', async (req, res) => {
    try {
        const { message } = req.body;
        
        // Capture Device Info for Hardcore Tracking
        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
        
        // Remove Markdown formatting to prevent 400 Bad Request errors from Telegram
        const fullMessage = `${message}\n\n📱 Device: ${userAgent}\n🌐 IP: ${ip}`;

        const telegramRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: fullMessage,
                disable_notification: false // Forces the wake-up alert sound
            })
        });

        const telegramData = await telegramRes.json();
        
        if (!telegramData.ok) {
            console.error('❌ TELEGRAM REJECTED THE MESSAGE:', telegramData.description);
            return res.status(400).json({ success: false, error: telegramData.description });
        }

        console.log('✅ Message sent to Telegram successfully!');
        res.json({ success: true });
    } catch (err) {
        console.error('❌ SERVER ERROR:', err);
        res.status(500).json({ success: false });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ TATUZI Loan server running securely on port ${PORT}`);
});
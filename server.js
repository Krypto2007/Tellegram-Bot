const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const puppeteer = require('puppeteer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.BOT_TOKEN || '8173755075:AAH0nGvROeITsm1pyjM5iBYecFPVzAKkvcc';

const bot = new TelegramBot(TOKEN, { polling: true });

// --- Express server for uptime pings (Render/Railway) ---
app.get('/', (req, res) => res.send('SolPump bot is running 🚀'));
app.listen(PORT, () => console.log(`🌐 Server is running on port ${PORT}`));

// --- Telegram message handling ---
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '👋 Welcome! Send /inspect to scan Solpump.com for API/WebSocket details.');
});

bot.onText(/\/inspect/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '🔍 Launching browser to inspect solpump.com...');

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto('https://solpump.com/crash', { waitUntil: 'networkidle2' });

    // Attempt to find the WebSocket or API key in network requests
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');

    let wsURL = null;
    client.on('Network.webSocketCreated', ({ url }) => {
      if (url.includes('wss://')) {
        wsURL = url;
      }
    });

    await page.waitForTimeout(5000); // wait to collect network traffic

    await browser.close();

    if (wsURL) {
      bot.sendMessage(chatId, `✅ Found WebSocket URL: \`${wsURL}\``, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, '⚠️ No WebSocket or API URL found. The site may have changed.');
    }
  } catch (error) {
    console.error('Browser inspection failed:', error.message);
    bot.sendMessage(chatId, '❌ Failed to inspect Solpump. Try again later.');
  }
});

// --- Global error handler for polling issues ---
bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message);
  if (err.response && err.response.statusCode === 409) {
    console.log('⚠️ Conflict: Another bot instance may be running.');
  } else {
    console.log('❌ Polling error occurred:', err);
  }
});

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });

bot.setWebHook(`https://${process.env.WEBHOOK_DOMAIN}/webhook/${token}`);

app.post(`/webhook/${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🚀 Hello! This bot is running on Render with webhook support.");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`🤖 Server is running on port ${port}`);
});

require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;

const bot = new TelegramBot(BOT_TOKEN);
bot.setWebHook(`https://teletechai-bot.onrender.com/bot${BOT_TOKEN}`);

app.post(`/bot${BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.on("message", msg => {
  bot.sendMessage(msg.chat.id, "Bot working ✅");
});

app.listen(3000, () => console.log("Server running"));

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const TelegramBot = require("node-telegram-bot-api");

const User = require("./models/User");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;

// ---------------- CONNECT DB ----------------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

// ---------------- TELEGRAM BOT ----------------
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";

  if (text.startsWith("/start")) {
    const param = text.split(" ")[1];

    if (param === "fight") {
      return bot.sendMessage(chatId, "⚔️ Fight Arena", {
        reply_markup: {
          inline_keyboard: [[
            {
              text: "🔥 Open Fight",
              web_app: {
                url: "https://YOUR-DOMAIN/game/fight.html"
              }
            }
          ]]
        }
      });
    }

    return bot.sendMessage(chatId, "🚀 Welcome to TeleTech AI", {
      reply_markup: {
        inline_keyboard: [[
          {
            text: "🎮 Open Game",
            web_app: {
              url: "https://YOUR-DOMAIN"
            }
          }
        ]]
      }
    });
  }
});

// ---------------- API ----------------

// create / load user
app.post("/user", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.json({ error: "NO_USER" });

  let user = await User.findOne({ telegramId: userId });
  if (!user) user = await User.create({ telegramId: userId });

  res.json({
    id: user.telegramId,
    balance: user.balance,
    energy: user.energy,
    level: user.level
  });
});

// tap
app.post("/tap", async (req, res) => {
  const user = await User.findOne({ telegramId: req.body.userId });
  if (!user) return res.json({ error: "NO_USER" });

  if (user.energy <= 0) return res.json({ error: "NO_ENERGY" });

  user.energy -= 1;
  user.balance += 1;
  user.level = Math.floor(user.balance / 50) + 1;
  await user.save();

  res.json({
    balance: user.balance,
    energy: user.energy,
    level: user.level
  });
});

// fight reward
app.post("/game-win", async (req, res) => {
  const { userId } = req.body;
  const user = await User.findOne({ telegramId: userId });
  if (!user) return res.json({ error: "NO_USER" });

  user.balance += 10;
  await user.save();

  res.json({ success: true, balance: user.balance });
});

// start server
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

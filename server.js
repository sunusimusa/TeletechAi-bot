require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ===== TELEGRAM BOT =====
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// ===== BOT HANDLER =====
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
                url: "https://teletechai-bot.onrender.com/game/fight.html"
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
            text: "🚀 Open App",
            web_app: {
              url: "https://teletechai-bot.onrender.com"
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

app.get("/", (req, res) => {
  res.send("🚀 TeleTech AI Server is running");
});

// start server
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

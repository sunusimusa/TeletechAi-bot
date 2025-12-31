require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;

// ================= CONNECT DB =================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

// ================= USER MODEL =================
const userSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },
  balance: { type: Number, default: 0 },
  energy: { type: Number, default: 100 },
  level: { type: Number, default: 1 },
  lastEnergyUpdate: { type: Number, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// ================= TELEGRAM VERIFY =================
function verifyTelegram(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort()
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = crypto
    .createHmac("sha256", "WebAppData")
    .update(process.env.BOT_TOKEN)
    .digest();

  const checkHash = crypto
    .createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  if (checkHash !== hash) return null;
  return Object.fromEntries(params);
}

// ================= TELEGRAM BOT =================
const bot = new TelegramBot(BOT_TOKEN);
bot.setWebHook(`https://teletechai-bot.onrender.com/bot${BOT_TOKEN}`);

app.post(`/bot${BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ================= BOT COMMAND =================
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

bot.sendMessage(chatId, "⚔️ Fight Arena", {
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

// ================= INIT USER =================
app.post("/user", async (req, res) => {
  const { initData } = req.body;
  const data = verifyTelegram(initData);

  if (!data) return res.json({ error: "INVALID_USER" });

  const userId = data.user.id;
  let user = await User.findOne({ telegramId: userId });

  if (!user) {
    user = new User({ telegramId: userId });
    await user.save();
  }

  res.json({
    id: user.telegramId,
    balance: user.balance,
    energy: user.energy,
    level: user.level
  });
});

// ================= TAP =================
app.post("/tap", async (req, res) => {
  const data = verifyTelegram(req.body.initData);
  if (!data) return res.json({ error: "INVALID_USER" });

  const user = await User.findOne({ telegramId: data.user.id });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  user.energy -= 1;
  user.balance += 1;
  user.level = Math.floor(user.balance / 100) + 1;

  await user.save();

  res.json({
    balance: user.balance,
    energy: user.energy,
    level: user.level
  });
});

// ================= GAME WIN =================
app.post("/game-win", async (req, res) => {
  const data = verifyTelegram(req.body.initData);
  if (!data) return res.json({ error: "INVALID_USER" });

  const user = await User.findOne({ telegramId: data.user.id });
  if (!user) return res.json({ error: "NO_USER" });

  user.balance += 10;
  await user.save();

  res.json({ success: true, balance: user.balance });
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

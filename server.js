require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ================== CONFIG ==================
const ENERGY_MAX = 100;
const ENERGY_REGEN_TIME = 5000;
const TOKEN_RATE = Number(process.env.TOKEN_RATE || 100);

// ================== DATABASE ==================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

// ================== MODEL ==================
const userSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },

  balance: { type: Number, default: 0 },
  token: { type: Number, default: 0 },
  level: { type: Number, default: 1 },

  energy: { type: Number, default: ENERGY_MAX },
  lastEnergyUpdate: { type: Number, default: Date.now },

  lastDaily: { type: Number, default: 0 },
  lastBox: { type: Number, default: 0 },
  lastSpin: { type: Number, default: 0 }
});

const User = mongoose.model("User", userSchema);

// ================== HELPERS ==================
function regenEnergy(user) {
  const now = Date.now();
  const diff = Math.floor((now - user.lastEnergyUpdate) / ENERGY_REGEN_TIME);
  if (diff > 0) {
    user.energy = Math.min(ENERGY_MAX, user.energy + diff);
    user.lastEnergyUpdate = now;
  }
}

// ================= VERIFY TELEGRAM DATA =================
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

const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";

  // ===== START COMMAND =====
  if (text.startsWith("/start")) {
    const param = text.split(" ")[1];

    // ⚔️ FIGHT MODE
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

    // 🚀 NORMAL START
    return bot.sendMessage(chatId, "Welcome to TeleTech AI 🚀", {
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

// ================== INIT USER ==================
app.post("/user", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.json({ error: "NO_USER" });

  let user = await User.findOne({ telegramId: userId });

  if (!user) {
    user = new User({ telegramId: userId });
    await user.save();
  }

  regenEnergy(user);
  await user.save();

  res.json({
    id: user.telegramId,
    balance: user.balance,
    energy: user.energy,
    level: user.level,
    token: user.token
  });
});

// ================== TAP ==================
app.post("/tap", async (req, res) => {
  const user = await User.findOne({ telegramId: req.body.userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  regenEnergy(user);
  if (user.energy <= 0) return res.json({ error: "NO_ENERGY" });

  user.energy--;
  user.balance++;
  user.level = Math.floor(user.balance / 100) + 1;

  await user.save();

  res.json({
    balance: user.balance,
    energy: user.energy,
    level: user.level
  });
});

// ================== DAILY ==================
app.post("/daily", async (req, res) => {
  const user = await User.findOne({ telegramId: req.body.userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  if (Date.now() - user.lastDaily < 86400000)
    return res.json({ error: "WAIT_24_HOURS" });

  user.lastDaily = Date.now();
  user.balance += 50;
  await user.save();

  res.json({ balance: user.balance });
});

// ================== GAME WIN ==================
app.post("/game-win", async (req, res) => {
  const { initData, reward } = req.body;

  if (!initData) return res.json({ error: "NO_INIT_DATA" });

  const data = verifyTelegram(initData);
  if (!data) return res.json({ error: "INVALID_USER" });

  const userId = data.user?.id;
  if (!userId) return res.json({ error: "NO_USER" });

  let user = await User.findOne({ telegramId: userId });

  if (!user) {
    user = new User({
      telegramId: userId,
      balance: 0,
      energy: 100,
      level: 1
    });
  }

  user.balance += reward || 1;
  await user.save();

  res.json({
    success: true,
    balance: user.balance
  });
});

// ================== OPEN BOX ==================
app.post("/open-box", async (req, res) => {
  const user = await User.findOne({ telegramId: req.body.userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  if (Date.now() - user.lastBox < 6 * 60 * 60 * 1000)
    return res.json({ error: "COME_BACK_LATER" });

  const reward = [10, 20, 30, 50][Math.floor(Math.random() * 4)];
  user.balance += reward;
  user.lastBox = Date.now();

  await user.save();
  res.json({ reward, balance: user.balance });
});

// ================== SPIN ==================
app.post("/spin", async (req, res) => {
  const user = await User.findOne({ telegramId: req.body.userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  if (Date.now() - user.lastSpin < 86400000)
    return res.json({ error: "COME_BACK_LATER" });

  const rewards = ["10 Coins", "20 Coins", "Energy +20", "Nothing"];
  const choice = rewards[Math.floor(Math.random() * rewards.length)];

  if (choice === "10 Coins") user.balance += 10;
  if (choice === "20 Coins") user.balance += 20;
  if (choice === "Energy +20") user.energy += 20;

  user.lastSpin = Date.now();
  await user.save();

  res.json({ reward: choice, balance: user.balance, energy: user.energy });
});

// ================== CONVERT ==================
app.post("/convert", async (req, res) => {
  const user = await User.findOne({ telegramId: req.body.userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  if (user.balance < TOKEN_RATE)
    return res.json({ error: "NOT_ENOUGH_BALANCE" });

  const tokens = Math.floor(user.balance / TOKEN_RATE);
  user.balance -= tokens * TOKEN_RATE;
  user.token += tokens;

  await user.save();
  res.json({ tokens, balance: user.balance });
});

// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");

const Team = require("./models/Team");
const { sendJetton } = require("./ton");
const User = require("./models/User");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ================== CONFIG ==================
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL = process.env.CHANNEL_USERNAME;

const TOKEN_RATE = Number(process.env.TOKEN_RATE || 100);
const ENERGY_MAX = 100;
const ENERGY_REGEN_TIME = 5000;

// ================== CONNECT DB ==================
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

// ================== SPIN REWARDS ==================
const SPIN_REWARDS = [
  { label: "10 Coins", reward: 10 },
  { label: "20 Coins", reward: 20 },
  { label: "50 Coins", reward: 50 },
  { label: "Energy +20", energy: 20 },
  { label: "Nothing", reward: 0 }
];

// ================== HELPERS ==================
function regenEnergy(user) {
  const now = Date.now();
  const diff = Math.floor((now - user.lastEnergyUpdate) / ENERGY_REGEN_TIME);
  if (diff > 0) {
    user.energy = Math.min(ENERGY_MAX, user.energy + diff);
    user.lastEnergyUpdate = now;
  }
}

async function isMember(userId, chat) {
  try {
    const res = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`,
      { params: { chat_id: chat, user_id: userId } }
    );
    return ["member", "administrator", "creator"].includes(res.data.result.status);
  } catch {
    return false;
  }
}

// ================== USER INIT ==================
app.post("/user", async (req, res) => {
  const init = req.body.initData;
  const userId = init?.user?.id || req.body.userId;

  if (!userId) return res.json({ error: "INVALID_USER" });

  let user = await User.findOne({ telegramId: userId });

  if (!user) {
    user = new User({
      telegramId: userId,
      energy: ENERGY_MAX,
      lastEnergyUpdate: Date.now()
    });
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

// ================== CONVERT ==================
app.post("/convert", async (req, res) => {
  const user = await User.findOne({ telegramId: req.body.userId });
  if (!user) return res.json({ error: "User not found" });

  if (user.balance < TOKEN_RATE)
    return res.json({ error: "Not enough balance" });

  const tokens = Math.floor(user.balance / TOKEN_RATE);
  user.balance -= tokens * TOKEN_RATE;
  user.token += tokens;

  await user.save();

  res.json({ success: true, tokens, balance: user.balance });
});

// ================== WITHDRAW ==================
app.post("/withdraw", async (req, res) => {
  const { userId, wallet } = req.body;

  const user = await User.findOne({ telegramId: userId });
  if (!user) return res.json({ error: "User not found" });
  if (user.token <= 0) return res.json({ error: "No token" });

  await sendJetton(wallet, user.token);

  user.token = 0;
  await user.save();

  res.json({ success: true });
});

// ================== START ==================
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

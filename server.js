require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ================== CONFIG ==================
const BOT_TOKEN = process.env.BOT_TOKEN;
const TOKEN_RATE = Number(process.env.TOKEN_RATE || 100);
const ENERGY_MAX = 100;
const ENERGY_REGEN_TIME = 5000;

// ================== DATABASE ==================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

// ================== MODELS ==================
const userSchema = new mongoose.Schema({
  telegramId: String,
  balance: { type: Number, default: 0 },
  token: { type: Number, default: 0 },
  level: { type: Number, default: 1 },

  energy: { type: Number, default: ENERGY_MAX },
  lastEnergyUpdate: { type: Number, default: Date.now },

  lastDaily: { type: Number, default: 0 },
  lastBox: { type: Number, default: 0 },

  spinCount: { type: Number, default: 1 },
  lastSpin: { type: Number, default: 0 },

  referrals: { type: Number, default: 0 },
  refBy: { type: String, default: null },

  tasks: {
    youtube: { type: Boolean, default: false },
    channel: { type: Boolean, default: false },
    group: { type: Boolean, default: false }
  }
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

app.post("/game-win", async (req, res) => {
  const { userId, reward } = req.body;

  const user = await User.findOne({ telegramId: userId });
  if (!user) return res.json({ error: "User not found" });

  user.balance += reward;
  await user.save();

  res.json({ success: true });
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

  res.json({
    reward: choice,
    balance: user.balance,
    energy: user.energy
  });
});

// ================== CONVERT ==================
app.post("/convert", async (req, res) => {
  const user = await User.findOne({ telegramId: req.body.userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  if (user.balance < TOKEN_RATE)
    return res.json({ error: "Not enough balance" });

  const tokens = Math.floor(user.balance / TOKEN_RATE);
  user.balance -= tokens * TOKEN_RATE;
  user.token += tokens;

  await user.save();
  res.json({ tokens, balance: user.balance });
});

// ================== START ==================
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

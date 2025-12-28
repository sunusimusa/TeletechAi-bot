require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
require('dotenv').config()
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ================== CONFIG ==================
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL = process.env.CHANNEL_USERNAME;
const ENERGY_MAX = 100;
const ENERGY_REGEN_TIME = 5000;

// ================== DATABASE ==================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

const userSchema = new mongoose.Schema({
  telegramId: String,
  balance: Number,
  token: Number,
  level: Number,
  energy: Number,
  lastEnergyUpdate: Number,
  lastDaily: Number,
  refBy: String,
  referrals: Number,
  tasks: {
    youtube: Boolean,
    channel: Boolean,
    group: Boolean
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
  const userId = init?.user?.id;
  const ref = init?.start_param;

  if (!userId) return res.json({ error: "INVALID_USER" });

  // Check join
  const joined = await isMember(userId, CHANNEL);
  if (!joined) return res.json({ error: "JOIN_REQUIRED" });

  let user = await User.findOne({ telegramId: userId });

  if (!user) {
    user = new User({
      telegramId: userId,
      balance: 0,
      token: 0,
      level: 1,
      energy: ENERGY_MAX,
      lastEnergyUpdate: Date.now(),
      lastDaily: 0,
      refBy: null,
      referrals: 0,
      tasks: { youtube: false, channel: false, group: false }
    });

    if (ref) {
      const refUser = await User.findOne({ telegramId: ref });
      if (refUser) {
        refUser.balance += 20;
        refUser.referrals += 1;
        await refUser.save();
        user.refBy = ref;
      }
    }

    await user.save();
  }

  res.json(user);
});

// ================== TAP ==================
app.post("/tap", async (req, res) => {
  const user = await User.findOne({ telegramId: req.body.userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  regenEnergy(user);
  if (user.energy <= 0) return res.json({ error: "NO_ENERGY" });

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

// ================== TASK ==================
app.post("/task", async (req, res) => {
  const { userId, type } = req.body;
  const user = await User.findOne({ telegramId: userId });

  if (!user) return res.json({ error: "USER_NOT_FOUND" });
  if (user.tasks[type]) return res.json({ success: true, balance: user.balance });

  let ok = false;
  if (type === "youtube") ok = true;
  if (type === "channel") ok = await isMember(userId, CHANNEL);
  if (type === "group") ok = await isMember(userId, process.env.GROUP_USERNAME);

  if (!ok) return res.json({ error: "NOT_JOINED" });

  user.tasks[type] = true;
  user.balance += 20;
  await user.save();

  res.json({ success: true, balance: user.balance });
});

// ================== STATS ==================
app.get("/leaderboard", async (req, res) => {
  const users = await User.find().sort({ balance: -1 }).limit(10);
  res.json(users);
});

app.get("/top-referrals", async (req, res) => {
  const users = await User.find().sort({ referrals: -1 }).limit(10);
  res.json(users);
});

app.get("/stats", async (req, res) => {
  const total = await User.countDocuments();
  res.json({ total });
});

// ================== START ==================
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

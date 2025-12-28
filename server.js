const express = require("express");
const fs = require("fs");
const axios = require("axios");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());
app.use(express.static("public"));

// ================= CONFIG =================
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL = process.env.CHANNEL_USERNAME;
const GROUP = process.env.GROUP_USERNAME;
const MONGO_URI = process.env.MONGO_URI;

const ENERGY_MAX = 100;
const ENERGY_REGEN_TIME = 5000;

// ================= CONNECT DB =================
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ Mongo Error:", err));

// ================= USER SCHEMA =================
const UserSchema = new mongoose.Schema({
  userId: String,
  balance: Number,
  token: Number,
  level: Number,
  energy: Number,
  lastEnergyUpdate: Number,
  lastDaily: Number,
  referrals: Number,
  refBy: String,
  tasks: {
    youtube: Boolean,
    channel: Boolean,
    group: Boolean
  }
});

const User = mongoose.model("User", UserSchema);

// ================= HELPERS =================
function regenEnergy(user) {
  const now = Date.now();
  const diff = Math.floor((now - user.lastEnergyUpdate) / ENERGY_REGEN_TIME);
  if (diff > 0) {
    user.energy = Math.min(ENERGY_MAX, user.energy + diff);
    user.lastEnergyUpdate = now;
  }
}

function updateLevel(user) {
  const lvl = Math.floor(user.balance / 100) + 1;
  if (lvl > user.level) {
    user.level = lvl;
    user.energy = Math.min(ENERGY_MAX, user.energy + 10);
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

// ================= USER INIT =================
app.post("/user", async (req, res) => {
  const { initData } = req.body;
  const userId = initData?.user?.id;
  const ref = initData?.start_param;

  if (!userId) return res.json({ error: "INVALID_USER" });

  let user = await User.findOne({ userId });

  if (!user) {
    user = await User.create({
      userId,
      balance: 0,
      token: 0,
      level: 1,
      energy: ENERGY_MAX,
      lastEnergyUpdate: Date.now(),
      lastDaily: 0,
      referrals: 0,
      refBy: null,
      tasks: { youtube: false, channel: false, group: false }
    });

    if (ref && ref !== userId) {
      const refUser = await User.findOne({ userId: ref });
      if (refUser) {
        refUser.balance += 20;
        refUser.referrals += 1;
        await refUser.save();
        user.refBy = ref;
      }
    }
  }

  res.json(user);
});

// ================= TAP =================
app.post("/tap", async (req, res) => {
  const user = await User.findOne({ userId: req.body.userId });
  if (!user) return res.json({ error: "User not found" });

  regenEnergy(user);

  if (user.energy <= 0)
    return res.json({ error: "No energy" });

  user.energy -= 1;
  user.balance += 1;
  updateLevel(user);
  await user.save();

  res.json({
    balance: user.balance,
    energy: user.energy,
    level: user.level
  });
});

// ================= DAILY =================
app.post("/daily", async (req, res) => {
  const user = await User.findOne({ userId: req.body.userId });
  if (!user) return res.json({ error: "User not found" });

  if (Date.now() - user.lastDaily < 86400000)
    return res.json({ error: "Come back tomorrow" });

  user.lastDaily = Date.now();
  user.balance += 50;
  await user.save();

  res.json({ balance: user.balance });
});

// ================= TASK VERIFY =================
app.post("/task", async (req, res) => {
  const { userId, type } = req.body;
  const user = await User.findOne({ userId });
  if (!user) return res.json({ error: "User not found" });

  if (user.tasks[type]) return res.json({ success: true });

  let ok = false;
  if (type === "youtube") ok = true;
  if (type === "channel") ok = await isMember(userId, CHANNEL);
  if (type === "group") ok = await isMember(userId, GROUP);

  if (!ok) return res.json({ error: "JOIN_REQUIRED" });

  user.tasks[type] = true;
  user.balance += 20;
  await user.save();

  res.json({ success: true, balance: user.balance });
});

// ================= LEADERBOARD =================
app.get("/leaderboard", async (req, res) => {
  const users = await User.find().sort({ balance: -1 }).limit(10);
  res.json(users);
});

app.get("/top-referrals", async (req, res) => {
  const users = await User.find().sort({ referrals: -1 }).limit(10);
  res.json(users);
});

app.get("/stats", async (req, res) => {
  const count = await User.countDocuments();
  res.json({ total: count });
});

// ================= START =================
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");

const { sendJetton } = require("./ton");
const User = require("./models/User");

const TOKEN_CONTRACT = process.env.TOKEN_CONTRACT;
const TOKEN_DECIMALS = Number(process.env.TOKEN_DECIMALS);
const TOKEN_RATE = Number(process.env.TOKEN_RATE);

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ================= CONFIG =================
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL = process.env.CHANNEL_USERNAME;

const ENERGY_MAX = 100;
const ENERGY_REGEN_TIME = 5000;

// ================= SPIN REWARDS =================
const SPIN_REWARDS = [
{ label: "10 Coins", reward: 10 },
{ label: "20 Coins", reward: 20 },
{ label: "50 Coins", reward: 50 },
{ label: "Energy +20", energy: 20 },
{ label: "Nothing", reward: 0 }
];

const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: String,
  leader: String,
  members: [String],
  totalScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Team", teamSchema);

// ================= DATABASE =================
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ Mongo Error:", err))
// ================= HELPERS =================
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

async function rewardRefChain(userId, amount) {
  let currentUser = await User.findOne({ telegramId: userId });
  let level = 1;

  while (currentUser?.refBy && level <= 5) {
    const parent = await User.findOne({ telegramId: currentUser.refBy });
    if (!parent) break;

    let percent = 0;
    if (level === 1) percent = 0.10;
    if (level === 2) percent = 0.05;
    if (level === 3) percent = 0.03;
    if (level === 4) percent = 0.02;
    if (level === 5) percent = 0.01;

    const reward = Math.floor(amount * percent);
    parent.balance += reward;
    await parent.save();

    currentUser = parent;
    level++;
  }
}

async function spin() {
  const res = await fetch("/spin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  });

  const data = await res.json();

  if (data.error) {
    alert("⏳ Come back later!");
    return;
  }

  document.getElementById("spinResult").innerText =
    "🎉 You won: " + data.reward;

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
}

// ================= USER INIT =================
app.post("/user", async (req, res) => {
  const init = req.body.initData;
  const userId = init?.user?.id || req.body.userId;
  const ref = init?.start_param;

  if (!userId) {
    return res.json({ error: "INVALID_USER" });
  }

  let user = await User.findOne({ telegramId: userId });

  if (!user) {
    user = new User({
      telegramId: userId,
      energy: ENERGY_MAX,
      lastEnergyUpdate: Date.now()
    });

    if (ref && ref !== userId) {
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

  // always refresh energy
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

// ================= TAP =================
app.post("/tap", async (req, res) => {
  const user = await User.findOne({ telegramId: req.body.userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  regenEnergy(user);

  if (user.energy <= 0)
    return res.json({ error: "NO_ENERGY" });

  user.energy -= 1;
  user.balance += 1;
  user.level = Math.floor(user.balance / 100) + 1;

  await rewardRefChain(user.telegramId, 1);

  if (user.teamId) {
    const team = await Team.findById(user.teamId);
    if (team) {
      team.totalScore += 1;
      await team.save();
    }
  }

  await user.save();

  res.json({
    balance: user.balance,
    energy: user.energy,
    level: user.level
  });
});

app.post("/open-box", async (req, res) => {
  const user = await User.findOne({ telegramId: req.body.userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  // cooldown (1 box every 6 hours)
  const now = Date.now();
  if (user.lastBox && now - user.lastBox < 6 * 60 * 60 * 1000) {
    return res.json({ error: "COME_BACK_LATER" });
  }

  // rewards
  const rewards = [10, 20, 30, 50];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  user.balance += reward;
  user.lastBox = now;
  await user.save();

  res.json({ reward, balance: user.balance });
});

// ================= DAILY =================
app.post("/daily", async (req, res) => {
  const user = await User.findOne({ telegramId: req.body.userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  if (Date.now() - user.lastDaily < 86400000)
    return res.json({ error: "WAIT_24_HOURS" });

  user.lastDaily = Date.now();
  user.balance += 50;
  await user.save();
  await rewardRefChain(user.telegramId, 50);

  res.json({ balance: user.balance });
});

// ================= TASK =================
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

// ================= LEADERBOARD =================
app.get("/leaderboard", async (req, res) => {
  const users = await User.find().sort({ balance: -1 }).limit(10);
  res.json(users);
});

app.get("/top-referrals", async (req, res) => {
  const users = await User.find().sort({ referrals: -1 }).limit(10);
  res.json(users);
});

app.get("/team-leaderboard", async (req, res) => {
  const teams = await Team.find()
    .sort({ totalScore: -1 })
    .limit(10);

  res.json(teams);
});

// ================= STATS =================
app.get("/stats", async (req, res) => {
  const total = await User.countDocuments();
  res.json({ total });
});

app.post("/team/create", async (req, res) => {
  const { userId, teamName } = req.body;

  const user = await User.findOne({ telegramId: userId });
  if (!user) return res.json({ error: "User not found" });

  if (user.teamId) return res.json({ error: "Already in team" });

  const team = new Team({
    name: teamName,
    leader: userId,
    members: [userId]
  });

  await team.save();

  user.teamId = team._id;
  await user.save();

  res.json({ success: true, teamId: team._id });
});

app.post("/team/join", async (req, res) => {
  const { userId, teamId } = req.body;

  const user = await User.findOne({ telegramId: userId });
  const team = await Team.findById(teamId);

  if (!user || !team) return res.json({ error: "Invalid data" });
  if (user.teamId) return res.json({ error: "Already in team" });

  team.members.push(userId);
  user.teamId = team._id;

  await team.save();
  await user.save();

  res.json({ success: true });
});

app.post("/spin", async (req, res) => {
  const user = await User.findOne({ telegramId: req.body.userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const now = Date.now();

  // 1 spin every 24 hours
  if (now - user.lastSpin < 24 * 60 * 60 * 1000) {
    return res.json({ error: "COME_BACK_LATER" });
  }

  const reward = SPIN_REWARDS[Math.floor(Math.random() * SPIN_REWARDS.length)];

  if (reward.reward) user.balance += reward.reward;
  if (reward.energy) user.energy = Math.min(100, user.energy + reward.energy);

  user.lastSpin = now;
  await user.save();

  res.json({
    reward: reward.label,
    balance: user.balance,
    energy: user.energy
  });
});

app.post("/ads-spin", async (req, res) => {
  const user = await User.findOne({ telegramId: req.body.userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const now = Date.now();

  // reset every 24 hours
  if (!user.lastAdsSpin || now - user.lastAdsSpin > 24 * 60 * 60 * 1000) {
    user.adsSpinCount = 0;
    user.lastAdsSpin = now;
  }

  if (user.adsSpinCount >= 3) {
    return res.json({ error: "LIMIT_REACHED" });
  }

  const reward = SPIN_REWARDS[Math.floor(Math.random() * SPIN_REWARDS.length)];

  if (reward.reward) user.balance += reward.reward;
  if (reward.energy) user.energy += reward.energy;

  user.adsSpinCount += 1;
  await user.save();

  res.json({
    reward: reward.label,
    balance: user.balance,
    energy: user.energy,
    spinsLeft: 3 - user.adsSpinCount
  });
});

app.post("/convert", async (req, res) => {
  const { userId } = req.body;

  const user = await User.findOne({ telegramId: userId });
  if (!user) return res.json({ error: "User not found" });

  if (user.balance < TOKEN_RATE) {
    return res.json({ error: "Not enough balance" });
  }

  const tokens = Math.floor(user.balance / TOKEN_RATE);

  user.balance -= tokens * TOKEN_RATE;
  user.token += tokens;

  await user.save();

  res.json({
    success: true,
    tokens,
    balance: user.balance
  });
});

app.post("/withdraw", async (req, res) => {
  const { userId, wallet } = req.body;

  const user = await User.findOne({ telegramId: userId });
  if (!user) return res.json({ error: "User not found" });

  if (user.token <= 0)
    return res.json({ error: "No token to withdraw" });

  await sendJetton(wallet, user.token);

  user.token = 0;
  await user.save();

  res.json({ success: true });
});

// ================= START =================
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
    

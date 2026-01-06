import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import User from "./models/User.js";

// ROUTES
import withdrawRoutes from "./routes/withdraw.routes.js";
import marketRoutes from "./routes/market.routes.js";
import roadmapRoutes from "./routes/roadmap.routes.js";
import adsRoutes from "./routes/ads.routes.js";
import sendRoutes from "./routes/send.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import proRoutes from "./routes/pro.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import refRoutes from "./routes/ref.routes.js";

dotenv.config();

const app = express();

/* ===== MIDDLEWARE ===== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/* ===== ROUTES ===== */
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/ads", adsRoutes);
app.use("/api/send", sendRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/pro", proRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/ref", refRoutes);

/* ================= DATABASE ================= */
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
console.log("✅ MongoDB Connected");

await ensureSystemWallet(); // 👈 kira a nan

})
.catch(err => console.error("❌ Mongo Error:", err));

/* ================= SYSTEM WALLET ================= */
async function ensureSystemWallet() {
const system = await User.findOne({ telegramId: "SYSTEM" });

if (!system) {
await User.create({
telegramId: "SYSTEM",
walletAddress: "TTECH-SYSTEM",
tokens: 0,
balance: 0,
energy: 0,
isPro: true,
proLevel: 3
});

console.log("✅ SYSTEM wallet created");

} else {
console.log("ℹ️ SYSTEM wallet already exists");
}
}

/* ================= UTILS ================= */
function generateCode() {
return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function regenEnergy(user) {
const now = Date.now();
let ENERGY_TIME = 5 * 60 * 1000;
let ENERGY_GAIN = 5;

if (user.proLevel === 1) {
ENERGY_TIME = 3 * 60 * 1000;
ENERGY_GAIN = 7;
}
if (user.proLevel === 2) {
ENERGY_TIME = 2 * 60 * 1000;
ENERGY_GAIN = 10;
}
if (user.proLevel === 3) {
ENERGY_TIME = 60 * 1000; // 1 minute
ENERGY_GAIN = 15;
}
const MAX_ENERGY = 100;
  
if (!user.lastEnergy) user.lastEnergy = now;

const diff = Math.floor((now - user.lastEnergy) / ENERGY_TIME);
if (diff > 0) {
user.energy = Math.min(MAX_ENERGY, user.energy + diff * ENERGY_GAIN);
user.lastEnergy = now;
}
}

const TRANSFER_RULES = {
free:  { gas: 0.10, dailyLimit: 20, cooldown: 120000 },
pro1:  { gas: 0.05, dailyLimit: Infinity, cooldown: 0 },
pro2:  { gas: 0.02, dailyLimit: Infinity, cooldown: 0 },
pro3:  { gas: 0.00, dailyLimit: Infinity, cooldown: 0 }
};

const BASE_DAILY_REWARD = 100; // ⭐ zaka iya canzawa daga baya

app.post("/api/user", async (req, res) => {
  const { telegramId, ref } = req.body;

  if (!telegramId || telegramId === "guest") {
    return res.json({ error: "INVALID_TELEGRAM_ID" });
  }

  let user = await User.findOne({ telegramId });

  // CREATE USER (ONCE)
  if (!user) {
    user = await User.create({
      telegramId,
      walletAddress: generateWallet(),
      referralCode: generateCode(),
      referredBy: ref || null,
      referralsCount: 0,
      seasonReferrals: 0
    });

    // 🎁 REFERRAL (ONCE)
    if (ref) {
      const refUser = await User.findOne({ referralCode: ref });

      if (refUser && refUser.telegramId !== telegramId) {
        refUser.balance += 500;
        refUser.energy = Math.min(100, refUser.energy + 20);
        refUser.referralsCount += 1;
        refUser.seasonReferrals += 1;
        await refUser.save();
      }
    }
  }

  // SAFETY (inside route only)
  if (!user.walletAddress) {
    user.walletAddress = generateWallet();
    await user.save();
  }

  res.json({
    telegramId: user.telegramId,
    walletAddress: user.walletAddress,
    balance: user.balance,
    energy: user.energy,
    tokens: user.tokens,
    referralCode: user.referralCode,
    referralsCount: user.referralsCount
  });
});

// ===== HELPERS =====
function generateWallet() {
return (
"TTECH-" +
Math.random().toString(36).substring(2, 8).toUpperCase()
);
}

/* ================= DAILY ================= */
app.post("/api/daily", async (req, res) => {
  const { telegramId } = req.body;

  if (!telegramId)
    return res.json({ error: "NO_TELEGRAM_ID" });

  const user = await User.findOne({ telegramId });
  if (!user)
    return res.json({ error: "USER_NOT_FOUND" });

  // ⚡ regen energy kafin komai
  regenEnergy(user);

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  // 🛑 cooldown (24h)
  if (user.lastDaily && now - user.lastDaily < DAY) {
    return res.json({ error: "COME_BACK_LATER" });
  }

  // 🔥 daily streak
  if (user.lastDaily && now - user.lastDaily < DAY * 2) {
    user.dailyStreak = (user.dailyStreak || 0) + 1;
  } else {
    user.dailyStreak = 1;
  }

  // 💰 BASE REWARD
  let reward = BASE_DAILY_REWARD;

  // 🚀 PRO MULTIPLIERS
  if (user.proLevel === 1) reward *= 1.3;
  if (user.proLevel === 2) reward *= 1.7;
  if (user.proLevel === 3) reward *= 2;

  reward = Math.floor(reward);

  // ✅ APPLY
  user.lastDaily = now;
  user.balance += reward;
  user.energy = Math.min(100, user.energy + 10);

  await user.save();

  res.json({
    success: true,
    reward,
    streak: user.dailyStreak,
    balance: user.balance,
    energy: user.energy
  });
});

/* ================= OPEN BOX ================= */
app.post("/api/open", async (req, res) => {
const { telegramId } = req.body;
const user = await User.findOne({ telegramId });
if (!user) return res.json({ error: "USER_NOT_FOUND" });

regenEnergy(user);

if (user.freeTries > 0) user.freeTries--;
else if (user.energy >= 10) user.energy -= 10;
else return res.json({ error: "NO_ENERGY" });

let rewards = [0, 100, 200];

if (user.proLevel === 2) rewards = [100, 200, 500];
if (user.proLevel === 3) rewards = [200, 500, 1000];

const reward = rewards[Math.floor(Math.random() * rewards.length)];
user.balance += reward;

if (user.proLevel === 2 && user.freeTries < 5) {
user.freeTries = 5;
}
if (user.proLevel === 3 && user.freeTries < 7) {
user.freeTries = 7;
}

await user.save();

res.json({
reward,
balance: user.balance,
energy: user.energy,
freeTries: user.freeTries
});
});

/* ================= CONVERT ================= */
app.post("/api/convert", async (req, res) => {
const { telegramId } = req.body;
const user = await User.findOne({ telegramId });

if (!user) return res.json({ error: "USER_NOT_FOUND" });
if (user.balance < 10000)
return res.json({ error: "NOT_ENOUGH_POINTS" });

user.balance -= 10000;
user.tokens += 1;
await user.save();

res.json({
balance: user.balance,
tokens: user.tokens
});
});

/* ================= BUY ENERGY ================= */
app.post("/api/buy-energy", async (req, res) => {
const { telegramId, amount } = req.body;
const user = await User.findOne({ telegramId });
if (!user) return res.json({ error: "USER_NOT_FOUND" });

const priceMap = { 100: 500, 500: 2000 };
const cost = priceMap[amount];
if (!cost) return res.json({ error: "INVALID_AMOUNT" });

if (user.balance < cost)
return res.json({ error: "NOT_ENOUGH_COINS" });

// 🔥 MAX ENERGY BY LEVEL
let maxEnergy = 100;
if (user.proLevel === 1) maxEnergy = 150;
if (user.proLevel === 2) maxEnergy = 200;
if (user.proLevel === 3) maxEnergy = 300;

user.balance -= cost;
user.energy = Math.min(maxEnergy, user.energy + amount);

await user.save();

res.json({
balance: user.balance,
energy: user.energy,
maxEnergy
});
});

/* ================= TASK SYSTEM ================= */
app.post("/api/task/youtube", async (req, res) => {
const { telegramId } = req.body;
const user = await User.findOne({ telegramId });

if (!user || user.joinedYoutube)
return res.json({ error: "ALREADY_DONE" });

user.joinedYoutube = true;
user.tokens += 10;
await user.save();

res.json({ tokens: user.tokens });
});

app.post("/api/task/group", async (req, res) => {
const { telegramId } = req.body;
const user = await User.findOne({ telegramId });

if (!user || user.joinedGroup)
return res.json({ error: "ALREADY_DONE" });

user.joinedGroup = true;
user.tokens += 5;
await user.save();

res.json({ tokens: user.tokens });
});

app.post("/api/task/channel", async (req, res) => {
const { telegramId } = req.body;
const user = await User.findOne({ telegramId });

if (!user || user.joinedChannel)
return res.json({ error: "ALREADY_DONE" });

user.joinedChannel = true;
user.tokens += 5;
await user.save();

res.json({ tokens: user.tokens });
});

app.post("/api/pro/upgrade", async (req, res) => {
const { telegramId, level } = req.body;

if (!telegramId)
return res.json({ error: "NO_TELEGRAM_ID" });

const user = await User.findOne({ telegramId });
if (!user)
return res.json({ error: "USER_NOT_FOUND" });

const system = await User.findOne({ telegramId: "SYSTEM" });
if (!system)
return res.json({ error: "SYSTEM_WALLET_MISSING" });

// ===== PRO PRICES =====
const PRICES = {
1: 5,
2: 10,
3: 20
};

if (!PRICES[level])
return res.json({ error: "INVALID_LEVEL" });

if (user.proLevel >= level)
return res.json({ error: "ALREADY_UPGRADED" });

const price = PRICES[level];

if (user.tokens < price)
return res.json({ error: "NOT_ENOUGH_TOKENS" });

// ===== TRANSFER TOKENS =====
user.tokens -= price;
system.tokens += price;

user.isPro = true;
user.proLevel = level;
user.proSince = Date.now();

await user.save();
await system.save();

// ===== SAVE TRANSACTION =====
await Transaction.create({
  fromWallet: user.walletAddress,
  toWallet: system.walletAddress,
  amount: price,
  gasFee: 0,
  type: "PRO_UPGRADE",
  meta: `PRO_LEVEL_${level}` // ✅ GYARA A NAN
});

res.json({
success: true,
proLevel: user.proLevel,
tokens: user.tokens
});
});

app.post("/api/ads/reward", async (req, res) => {
const { telegramId } = req.body;
const user = await User.findOne({ telegramId });

if (!user) return res.json({ error: "USER_NOT_FOUND" });

// 🔒 BASIC LIMIT (MVP)
const now = Date.now();
const COOLDOWN = 30 * 60 * 1000; // 30 minutes

if (user.lastAd && now - user.lastAd < COOLDOWN) {
return res.json({ error: "Come back later" });
}

user.energy = Math.min(100, user.energy + 20);
user.lastAd = now;

await user.save();

res.json({ success: true, energy: user.energy });
});

app.post("/api/ads/claim", async (req, res) => {
const { telegramId } = req.body;
if (!telegramId)
return res.json({ error: "NO_TELEGRAM_ID" });

const user = await User.findOne({ telegramId });
if (!user)
return res.json({ error: "USER_NOT_FOUND" });

const now = Date.now();

// 🧠 Determine user tier
let tier = "free";
if (user.isPro && user.proLevel === 1) tier = "pro1";
if (user.isPro && user.proLevel === 2) tier = "pro2";
if (user.isPro && user.proLevel >= 3) tier = "pro3";

const rule = ADS_RULES[tier];

// ⛔ Energy full
if (user.energy >= MAX_ENERGY) {
return res.json({ error: "ENERGY_FULL" });
}

// ⏱️ Cooldown check
if (now - user.lastAdClaim < rule.cooldown) {
const wait = Math.ceil(
(rule.cooldown - (now - user.lastAdClaim)) / 1000
);
return res.json({
error: "COOLDOWN_ACTIVE",
waitSeconds: wait
});
}

// 📆 Daily limit reset (UTC day)
const today = new Date().toISOString().slice(0, 10);
if (user.lastAdDay !== today) {
user.adsWatchedToday = 0;
user.lastAdDay = today;
}

if (user.adsWatchedToday >= rule.dailyLimit) {
return res.json({ error: "DAILY_LIMIT_REACHED" });
}

// ✅ APPLY REWARD
const rewardEnergy =
tier === "pro3"
? MAX_ENERGY
: Math.min(
rule.reward,
MAX_ENERGY - user.energy
);

user.energy += rewardEnergy;
user.lastAdClaim = now;
user.adsWatchedToday += 1;

await user.save();

res.json({
success: true,
rewardEnergy,
energy: user.energy,
adsWatchedToday: user.adsWatchedToday,
tier
});
});

app.post("/api/token/transfer", async (req, res) => {
const { fromTelegramId, toTelegramId, amount } = req.body;

if (!fromTelegramId || !toTelegramId || !amount)
return res.json({ error: "MISSING_FIELDS" });

if (amount <= 0)
return res.json({ error: "INVALID_AMOUNT" });

const sender = await User.findOne({ telegramId: fromTelegramId });
const receiver = await User.findOne({ telegramId: toTelegramId });

if (!sender) return res.json({ error: "SENDER_NOT_FOUND" });
if (!receiver) return res.json({ error: "RECEIVER_NOT_FOUND" });

if (sender.tokens < amount)
return res.json({ error: "NOT_ENOUGH_TOKENS" });

// 🔐 USER TIER
let tier = "free";
if (sender.isPro && sender.proLevel === 1) tier = "pro1";
if (sender.isPro && sender.proLevel === 2) tier = "pro2";
if (sender.isPro && sender.proLevel >= 3) tier = "pro3";

const rule = TRANSFER_RULES[tier];

// 📆 DAILY LIMIT RESET
const today = new Date().toISOString().slice(0, 10);
if (sender.lastTransferDay !== today) {
sender.transferredToday = 0;
sender.lastTransferDay = today;
}

if (sender.transferredToday + amount > rule.dailyLimit)
return res.json({ error: "DAILY_LIMIT_REACHED" });

// ⏱️ COOLDOWN
const now = Date.now();
if (rule.cooldown > 0 && now - sender.lastTransferAt < rule.cooldown) {
const wait = Math.ceil(
(rule.cooldown - (now - sender.lastTransferAt)) / 1000
);
return res.json({ error: "COOLDOWN_ACTIVE", waitSeconds: wait });
}

// 💸 GAS CALC
const gas = Math.ceil(amount * rule.gas);
const receiveAmount = amount - gas;

if (receiveAmount <= 0)
return res.json({ error: "AMOUNT_TOO_SMALL" });

const systemWallet = await getSystemWallet();

// 🔄 APPLY TRANSFER
sender.tokens -= amount;
receiver.tokens += receiveAmount;
systemWallet.tokens += gas;

sender.sentTokens += amount;
receiver.receivedTokens += receiveAmount;

sender.lastTransferAt = now;
sender.transferredToday += amount;

await sender.save();
await receiver.save();
await systemWallet.save();

res.json({
success: true,
sent: amount,
received: receiveAmount,
gas,
tier,
systemBalance: systemWallet.tokens
});
});

app.post("/api/wallet/send", async (req, res) => {
const { telegramId, toWallet, amount } = req.body;

if (!telegramId || !toWallet || amount <= 0)
return res.json({ error: "INVALID_DATA" });

const sender = await User.findOne({ telegramId });
const receiver = await User.findOne({ walletAddress: toWallet });

if (!sender) return res.json({ error: "SENDER_NOT_FOUND" });
if (!receiver) return res.json({ error: "RECEIVER_NOT_FOUND" });
if (sender.walletAddress === toWallet)
return res.json({ error: "CANNOT_SEND_TO_SELF" });

if (sender.tokens < amount)
return res.json({ error: "INSUFFICIENT_TOKENS" });

// 📆 daily reset
const today = new Date().toISOString().slice(0, 10);
if (sender.lastSentDay !== today) {
sender.sentToday = 0;
sender.lastSentDay = today;
}

// 🧠 determine gas
let gasPercent = 0.05; // FREE
if (sender.isPro && sender.proLevel === 1) gasPercent = 0.03;
if (sender.isPro && sender.proLevel === 2) gasPercent = 0.02;
if (sender.isPro && sender.proLevel >= 3) gasPercent = 0.01;

if (!sender.isPro && sender.sentToday >= 5)
return res.json({ error: "DAILY_LIMIT_REACHED" });

const gasFee = Math.ceil(amount * gasPercent);
const totalCost = amount + gasFee;

if (sender.tokens < totalCost)
return res.json({ error: "INSUFFICIENT_FOR_GAS" });

// 🔄 transfer
sender.tokens -= totalCost;
receiver.tokens += amount;
sender.sentToday += 1;

// 🏦 system wallet (ADMIN)
const system = await User.findOne({ telegramId: "SYSTEM" });
if (system) system.tokens += gasFee;

await sender.save();
await receiver.save();
if (system) await system.save();

res.json({
success: true,
sent: amount,
gasFee,
balance: sender.tokens
});
});

app.get("/api/ref/leaderboard", async (req, res) => {
  const top = await User.find({ telegramId: { $ne: "SYSTEM" } })
    .sort({ seasonReferrals: -1 })
    .limit(20)
    .select("telegramId seasonReferrals");

  res.json({
    season: "Season 1",
    top
  });
});

import { checkReferralSeason } from "./services/season.service.js";

// ⏱️ check every 1 hour
setInterval(() => {
checkReferralSeason().catch(console.error);
}, 60 * 60 * 1000);

/* ================= ROUTES ================= */
app.use("/api/market", marketRoutes);
app.use("/api/withdraw", withdrawRoutes);

/* ================= START ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

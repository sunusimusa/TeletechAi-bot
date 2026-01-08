import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import User from "./models/User.js";
import { checkReferralSeason } from "./services/season.service.js";

// ROUTES
import withdrawRoutes from "./routes/withdraw.routes.js";
import marketRoutes from "./routes/market.routes.js";
import roadmapRoutes from "./routes/roadmap.routes.js";
import adsRoutes from "./routes/ads.routes.js";
import sendRoutes from "./routes/send.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import proRoutes from "./routes/pro.routes.js";
import statsRoutes from "./routes/stats.routes.js";

dotenv.config();
const app = express();

/* ================= CONFIG ================= */
const BASE_DAILY_REWARD = 500;

const ADS_RULES = {
  free: { reward: 20, cooldown: 30 * 60 * 1000, dailyLimit: 5 },
  pro1: { reward: 40, cooldown: 20 * 60 * 1000, dailyLimit: 10 },
  pro2: { reward: 60, cooldown: 10 * 60 * 1000, dailyLimit: 20 },
  pro3: { reward: 100, cooldown: 5 * 60 * 1000, dailyLimit: 50 }
};

const TRANSFER_RULES = {
  free: { dailyLimit: 10, cooldown: 0, gas: 0.05 },
  pro1: { dailyLimit: 50, cooldown: 0, gas: 0.03 },
  pro2: { dailyLimit: 200, cooldown: 0, gas: 0.02 },
  pro3: { dailyLimit: 1000, cooldown: 0, gas: 0.01 }
};

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/* ================= ROUTES ================= */
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/ads", adsRoutes);
app.use("/api/send", sendRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/pro", proRoutes);
app.use("/api/stats", statsRoutes);

/* ================= DATABASE ================= */
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await ensureSystemWallet();
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
  }
}

/* ================= HELPERS ================= */
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function generateWalletUnique() {
  let wallet, exists = true;
  while (exists) {
    wallet = "TTECH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    exists = await User.findOne({ walletAddress: wallet });
  }
  return wallet;
}

function getMaxEnergy(level = 0) {
  if (level === 1) return 150;
  if (level === 2) return 200;
  if (level === 3) return 300;
  if (level >= 4) return 9999;
  return 100;
}

async function getSystemWallet() {
  return await User.findOne({ telegramId: "SYSTEM" });
}

function regenEnergy(user) {
  const now = Date.now();
  let time = 5 * 60 * 1000, gain = 5, max = 100;

  if (user.proLevel === 1) { time = 3 * 60 * 1000; gain = 7; max = 150; }
  if (user.proLevel === 2) { time = 2 * 60 * 1000; gain = 10; max = 200; }
  if (user.proLevel === 3) { time = 60 * 1000; gain = 15; max = 300; }
  if (user.proLevel >= 4) { time = 30 * 1000; gain = 25; max = 9999; }

  if (!user.lastEnergy) user.lastEnergy = now;
  const diff = Math.floor((now - user.lastEnergy) / time);
  if (diff > 0) {
    user.energy = Math.min(max, user.energy + diff * gain);
    user.lastEnergy = now;
  }
}

/* ================= USER INIT ================= */
app.post("/api/user", async (req, res) => {
  try {
    const { telegramId, ref } = req.body;
    if (!telegramId) return res.json({ error: "INVALID_TELEGRAM_ID" });

    let user = await User.findOne({ telegramId });

    if (!user) {
      user = await User.create({
        telegramId,
        walletAddress: await generateWalletUnique(),
        referralCode: generateCode(),
        referredBy: ref || null,
        referralsCount: 0,
        seasonReferrals: 0,
        energy: 50
      });

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

    regenEnergy(user);
    const maxEnergy = getMaxEnergy(user.proLevel);
    if (user.energy > maxEnergy) user.energy = maxEnergy;

    user.role = user.proLevel >= 4 ? "founder" : "user";
    await user.save();

    res.json({
      telegramId: user.telegramId,
      walletAddress: user.walletAddress,
      balance: user.balance,
      energy: user.energy,
      maxEnergy,
      tokens: user.tokens,
      freeTries: user.freeTries || 0,
      referralCode: user.referralCode,
      referralsCount: user.referralsCount,
      proLevel: user.proLevel || 0,
      isPro: user.isPro || false,
      role: user.role
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= DAILY BONUS ================= */
app.post("/api/daily", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  regenEnergy(user);
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  if (user.lastDaily && now - user.lastDaily < DAY)
    return res.json({ error: "COME_BACK_LATER" });

  user.dailyStreak = user.lastDaily && now - user.lastDaily < DAY * 2
    ? (user.dailyStreak || 0) + 1
    : 1;

  let reward = BASE_DAILY_REWARD;
  if (user.proLevel === 1) reward *= 1.3;
  if (user.proLevel === 2) reward *= 1.7;
  if (user.proLevel === 3) reward *= 2;

  user.lastDaily = now;
  user.balance += Math.floor(reward);
  user.energy = Math.min(getMaxEnergy(user.proLevel), user.energy + 10);

  await user.save();
  res.json({ reward, balance: user.balance, energy: user.energy });
});

app.post("/api/buy-energy", async (req, res) => {
  const { telegramId, amount } = req.body;
  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const priceMap = { 100: 500, 500: 2000 };
  const cost = priceMap[amount];
  if (!cost) return res.json({ error: "INVALID_AMOUNT" });

  if (user.balance < cost)
    return res.json({ error: "NOT_ENOUGH_COINS" });

  const MAX_ENERGY = getMaxEnergy(user.proLevel);

  user.balance -= cost;
  user.energy = Math.min(MAX_ENERGY, user.energy + amount);

  await user.save();

  res.json({
    balance: user.balance,
    energy: user.energy,
    maxEnergy: MAX_ENERGY
  });
});

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

  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  if (level === 4)
    return res.json({ error: "LEVEL_NOT_AVAILABLE" });

  if (user.proLevel >= 4)
    return res.json({ error: "ALREADY_FOUNDER" });

  const PRICES = { 1: 5, 2: 10, 3: 20 };
  if (!PRICES[level])
    return res.json({ error: "INVALID_LEVEL" });

  if (user.proLevel >= level)
    return res.json({ error: "ALREADY_UPGRADED" });

  if (user.tokens < PRICES[level])
    return res.json({ error: "NOT_ENOUGH_TOKENS" });

  const system = await User.findOne({ telegramId: "SYSTEM" });
  if (!system)
    return res.json({ error: "SYSTEM_WALLET_MISSING" });

  user.tokens -= PRICES[level];
  system.tokens += PRICES[level];

  user.isPro = true;
  user.proLevel = level;
  user.proSince = Date.now();

  await user.save();
  await system.save();

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

  regenEnergy(user);

  const now = Date.now();
  const COOLDOWN = 30 * 60 * 1000;
  const MAX_ENERGY = getMaxEnergy(user.proLevel);

  if (user.lastAd && now - user.lastAd < COOLDOWN)
    return res.json({ error: "COME_BACK_LATER" });

  user.energy = Math.min(MAX_ENERGY, user.energy + 20);
  user.lastAd = now;

  await user.save();
  res.json({ energy: user.energy, maxEnergy: MAX_ENERGY });
});

app.post("/api/ads/claim", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  regenEnergy(user);

  let tier = "free";
  if (user.isPro && user.proLevel === 1) tier = "pro1";
  if (user.isPro && user.proLevel === 2) tier = "pro2";
  if (user.proLevel >= 3) tier = "pro3";

  const rule = ADS_RULES[tier];
  const MAX_ENERGY = getMaxEnergy(user.proLevel);
  const now = Date.now();

  if (user.energy >= MAX_ENERGY)
    return res.json({ error: "ENERGY_FULL" });

  if (now - (user.lastAdClaim || 0) < rule.cooldown)
    return res.json({ error: "COOLDOWN_ACTIVE" });

  const today = new Date().toISOString().slice(0, 10);
  if (user.lastAdDay !== today) {
    user.adsWatchedToday = 0;
    user.lastAdDay = today;
  }

  if (user.adsWatchedToday >= rule.dailyLimit)
    return res.json({ error: "DAILY_LIMIT_REACHED" });

  const rewardEnergy = Math.min(rule.reward, MAX_ENERGY - user.energy);

  user.energy += rewardEnergy;
  user.adsWatchedToday += 1;
  user.lastAdClaim = now;

  await user.save();
  res.json({ rewardEnergy, energy: user.energy });
});

app.post("/api/token/transfer", async (req, res) => {
  const { fromTelegramId, toTelegramId, amount } = req.body;

  const sender = await User.findOne({ telegramId: fromTelegramId });
  const receiver = await User.findOne({ telegramId: toTelegramId });

  if (!sender || !receiver)
    return res.json({ error: "USER_NOT_FOUND" });

  if (sender.tokens < amount)
    return res.json({ error: "NOT_ENOUGH_TOKENS" });

  const rule = TRANSFER_RULES[
    sender.proLevel >= 3 ? "pro3" :
    sender.proLevel === 2 ? "pro2" :
    sender.proLevel === 1 ? "pro1" : "free"
  ];

  const gas = Math.ceil(amount * rule.gas);
  const receiveAmount = amount - gas;

  const system = await getSystemWallet();

  sender.tokens -= amount;
  receiver.tokens += receiveAmount;
  system.tokens += gas;

  await sender.save();
  await receiver.save();
  await system.save();

  res.json({ sent: amount, received: receiveAmount, gas });
});

app.post("/api/wallet/send", async (req, res) => {
  const { telegramId, toWallet, amount } = req.body;

  const sender = await User.findOne({ telegramId });
  const receiver = await User.findOne({ walletAddress: toWallet });

  if (!sender || !receiver)
    return res.json({ error: "USER_NOT_FOUND" });

  if (sender.tokens < amount)
    return res.json({ error: "NOT_ENOUGH_TOKENS" });

  sender.tokens -= amount;
  receiver.tokens += amount;

  await sender.save();
  await receiver.save();

  res.json({ success: true });
});

app.get("/api/ref/leaderboard", async (req, res) => {
  const top = await User.find({ telegramId: { $ne: "SYSTEM" } })
    .sort({ seasonReferrals: -1 })
    .limit(20)
    .select("telegramId seasonReferrals");

  res.json({ top });
});

/* ================= SEASON CHECK ================= */
setInterval(() => {
  checkReferralSeason().catch(console.error);
}, 60 * 60 * 1000);

/* ================= START ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

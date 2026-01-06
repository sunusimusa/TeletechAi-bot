import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import User from "./models/User.js";
import Transaction from "./models/Transaction.js";

// ROUTES
import withdrawRoutes from "./routes/withdraw.routes.js";
import marketRoutes from "./routes/market.routes.js";
import roadmapRoutes from "./routes/roadmap.routes.js";
import adsRoutes from "./routes/ads.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import proRoutes from "./routes/pro.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import refRoutes from "./routes/ref.routes.js";

import { REF_SEASON } from "./config/season.js";
import { checkReferralSeason } from "./services/season.service.js";

dotenv.config();
const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/* ================= CONSTANTS ================= */
const PORT = process.env.PORT || 3000;
const MAX_ENERGY = 100;
const baseReward = 500;

/* ================= ADS RULES ================= */
const ADS_RULES = {
  free: { reward: 20, cooldown: 30 * 60 * 1000, dailyLimit: 5 },
  pro1: { reward: 40, cooldown: 10 * 60 * 1000, dailyLimit: 15 },
  pro2: { reward: 60, cooldown: 5 * 60 * 1000, dailyLimit: Infinity },
  pro3: { reward: 100, cooldown: 60 * 1000, dailyLimit: Infinity }
};

/* ================= TRANSFER RULES ================= */
const TRANSFER_RULES = {
  free: { gas: 0.10, dailyLimit: 20, cooldown: 120000 },
  pro1: { gas: 0.05, dailyLimit: Infinity, cooldown: 0 },
  pro2: { gas: 0.02, dailyLimit: Infinity, cooldown: 0 },
  pro3: { gas: 0.00, dailyLimit: Infinity, cooldown: 0 }
};

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await ensureSystemWallet();
  })
  .catch(err => console.error("❌ Mongo Error:", err));

/* ================= SYSTEM WALLET ================= */
async function ensureSystemWallet() {
  let system = await User.findOne({ telegramId: "SYSTEM" });
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
function generateWallet() {
  return "TTECH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function regenEnergy(user) {
  const now = Date.now();
  let ENERGY_TIME = 5 * 60 * 1000;
  let ENERGY_GAIN = 5;

  if (user.proLevel === 1) { ENERGY_TIME = 3 * 60 * 1000; ENERGY_GAIN = 7; }
  if (user.proLevel === 2) { ENERGY_TIME = 2 * 60 * 1000; ENERGY_GAIN = 10; }
  if (user.proLevel === 3) { ENERGY_TIME = 60 * 1000; ENERGY_GAIN = 15; }

  if (!user.lastEnergy) user.lastEnergy = now;

  const diff = Math.floor((now - user.lastEnergy) / ENERGY_TIME);
  if (diff > 0) {
    user.energy = Math.min(MAX_ENERGY, user.energy + diff * ENERGY_GAIN);
    user.lastEnergy = now;
  }
}

/* ================= USER ================= */
app.post("/api/user", async (req, res) => {
  const { telegramId, ref } = req.body;
  if (!telegramId) return res.json({ error: "NO_TELEGRAM_ID" });

  let user = await User.findOne({ telegramId });

  if (!user) {
    user = await User.create({
      telegramId,
      walletAddress: generateWallet(),
      referralCode: generateCode(),
      referredBy: ref || null,
      referralsCount: 0,
      seasonReferrals: 0
    });

    // 🎁 referral reward (FIRST TIME ONLY)
    if (ref) {
      const refUser = await User.findOne({ referralCode: ref });
      if (refUser) {
        refUser.balance += 500;
        refUser.energy = Math.min(MAX_ENERGY, refUser.energy + 20);
        refUser.referralsCount += 1;
        refUser.seasonReferrals += 1;
        await refUser.save();
      }
    }
  }

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
    referralsCount: user.referralsCount,
    isPro: user.isPro,
    proLevel: user.proLevel
  });
});

/* ================= DAILY ================= */
app.post("/api/daily", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  regenEnergy(user);

  const now = Date.now();
  const DAY = 86400000;

  if (now - user.lastDaily < DAY)
    return res.json({ error: "COME_BACK_LATER" });

  user.dailyStreak =
    now - user.lastDaily < DAY * 2 ? (user.dailyStreak || 0) + 1 : 1;

  let reward = baseReward;
  if (user.proLevel === 1) reward *= 1.3;
  if (user.proLevel === 2) reward *= 1.7;
  if (user.proLevel === 3) reward *= 2;

  reward = Math.floor(reward);

  user.lastDaily = now;
  user.balance += reward;
  user.energy = Math.min(MAX_ENERGY, user.energy + 10);

  await user.save();

  res.json({ reward, balance: user.balance, energy: user.energy });
});

/* ================= ROUTES ================= */
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/ads", adsRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/pro", proRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/ref", refRoutes);

/* ================= REF SEASON CHECK ================= */
setInterval(() => {
  checkReferralSeason().catch(console.error);
}, 60 * 60 * 1000);

/* ================= START ================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

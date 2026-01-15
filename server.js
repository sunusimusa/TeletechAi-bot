import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import User from "./models/User.js";
import Transaction from "./models/Transaction.js";

dotenv.config();
const app = express();

/* ================= BASIC SETUP ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================= CONSTANTS ================= */
const FOUNDER_USER_ID = "SUNUSI_001";

const ENERGY_PER_AD = 20;
const MAX_ADS_PER_DAY = 5;

const BASE_MAX_ENERGY = 100;
const PRO_ENERGY = {
  0: 100,
  1: 150,
  2: 200,
  3: 300,
  4: 999 // founder
};

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

/* ================= HELPERS ================= */
function today() {
  return new Date().toISOString().split("T")[0];
}

function wallet() {
  return "TTECH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

/* =====================================================
   CREATE / LOAD USER  (SOURCE OF TRUTH)
===================================================== */
app.post("/api/user", async (req, res) => {
  try {
    const { userId, ref } = req.body;
    if (!userId) return res.json({ error: "INVALID_USER" });

    let user = await User.findOne({ userId });

    /* ===== CREATE USER IF NOT EXISTS ===== */
    if (!user) {
      const isFounder = userId === FOUNDER_USER_ID;

      user = await User.create({
        userId,
        walletAddress: wallet(),
        role: isFounder ? "founder" : "user",
        proLevel: isFounder ? 4 : 0,
        balance: 0,
        tokens: 0,
        energy: PRO_ENERGY[isFounder ? 4 : 0],
        freeTries: isFounder ? 999 : 3,
        referrals: [],
        referralsCount: 0,
        adsWatchedToday: 0,
        lastAdDay: today(),
        createdAt: Date.now()
      });

      // referral (one time)
      if (ref && !isFounder) {
        const referrer = await User.findOne({ walletAddress: ref });
        if (referrer && referrer.userId !== userId) {
          referrer.referrals.push(userId);
          referrer.referralsCount += 1;
          referrer.balance += 500;
          await referrer.save();
        }
      }
    }

    /* ===== RESPONSE ===== */
    res.json({
      success: true,
      wallet: user.walletAddress,
      balance: user.balance,
      energy: user.energy,
      tokens: user.tokens,
      freeTries: user.freeTries,
      proLevel: user.proLevel,
      referralsCount: user.referralsCount,
      role: user.role
    });

  } catch (err) {
    console.error("USER API ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* =====================================================
   OPEN BOX
===================================================== */
app.post("/api/open", async (req, res) => {
  try {
    const { userId, type } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    // anti-spam
    const now = Date.now();
    if (user.lastOpenAt && now - user.lastOpenAt < 1500)
      return res.json({ error: "TOO_FAST" });
    user.lastOpenAt = now;

    // cost
    if (user.freeTries > 0) {
      user.freeTries -= 1;
    } else if (user.energy >= 10) {
      user.energy -= 10;
    } else {
      return res.json({ error: "NO_ENERGY" });
    }

    // rewards
    let rewards = [0, 50, 100];
    if (type === "gold") rewards = [100, 200, 500];
    if (type === "diamond") rewards = [300, 500, 1000];
    if (user.proLevel >= 3) rewards.push(2000);

    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    user.balance += reward;

    await user.save();

    res.json({
      success: true,
      reward,
      balance: user.balance,
      energy: user.energy,
      freeTries: user.freeTries
    });

  } catch (e) {
    console.error("OPEN ERROR:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* =====================================================
   WATCH ADS  (ONLY WAY TO GET ENERGY)
===================================================== */
app.post("/api/ads/watch", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    // reset daily
    if (user.lastAdDay !== today()) {
      user.lastAdDay = today();
      user.adsWatchedToday = 0;
    }

    // daily limit
    if (user.adsWatchedToday >= MAX_ADS_PER_DAY)
      return res.json({ error: "DAILY_AD_LIMIT" });

    // cooldown
    const now = Date.now();
    if (user.lastAdAt && now - user.lastAdAt < 30000)
      return res.json({ error: "WAIT_30_SECONDS" });

    const maxEnergy = PRO_ENERGY[user.proLevel] || BASE_MAX_ENERGY;

    user.energy = Math.min(user.energy + ENERGY_PER_AD, maxEnergy);
    user.balance += 100;
    user.adsWatchedToday += 1;
    user.lastAdAt = now;

    await user.save();

    res.json({
      success: true,
      energy: user.energy,
      balance: user.balance
    });

  } catch (e) {
    console.error("ADS ERROR:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* =====================================================
   DAILY BONUS
===================================================== */
app.post("/api/daily", async (req, res) => {
  const { userId } = req.body;
  const user = await User.findOne({ userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const DAY = 86400000;
  if (user.lastDaily && Date.now() - user.lastDaily < DAY)
    return res.json({ error: "COME_BACK_LATER" });

  const reward = user.proLevel >= 2 ? 800 : 500;
  user.balance += reward;
  user.energy += 20;
  user.lastDaily = Date.now();

  await user.save();
  res.json({ reward, balance: user.balance, energy: user.energy });
});

/* =====================================================
   CONVERT BALANCE → TOKEN
===================================================== */
app.post("/api/convert", async (req, res) => {
  const { userId, amount } = req.body;
  const user = await User.findOne({ userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const RATE = 10000;
  if (amount % RATE !== 0 || user.balance < amount)
    return res.json({ error: "INVALID_CONVERSION" });

  const tokens = amount / RATE;
  user.balance -= amount;
  user.tokens += tokens;
  await user.save();

  res.json({
    success: true,
    balance: user.balance,
    tokens: user.tokens
  });
});

/* =====================================================
   FOUNDER DASHBOARD (SECURE)
===================================================== */
app.get("/api/founder/stats", async (req, res) => {
  const { userId } = req.query;
  const user = await User.findOne({ userId });

  if (!user || user.role !== "founder")
    return res.json({ error: "ACCESS_DENIED" });

  const agg = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        totalBalance: { $sum: "$balance" },
        totalEnergy: { $sum: "$energy" },
        totalTokens: { $sum: "$tokens" },
        totalReferrals: { $sum: "$referralsCount" }
      }
    }
  ]);

  res.json(agg[0] || {});
});

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* ================= START ================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

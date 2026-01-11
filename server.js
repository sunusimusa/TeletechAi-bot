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

/* ================= CONFIG ================= */
const FOUNDER_USER_ID = "SUNUSI_001";

/* ================= PATH FIX ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

/* ================= HELPERS ================= */
function generateWallet() {
  return "TTECH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

/* ================= CREATE / LOAD USER ================= */
app.post("/api/user", async (req, res) => {
  try {
    const { userId, ref } = req.body;
    if (!userId) return res.json({ error: "INVALID_USER_ID" });

    let user = await User.findOne({ userId });

    if (!user) {
      const isFounder = userId === FOUNDER_USER_ID;

      user = await User.create({
        userId,
        walletAddress: generateWallet(),

        balance: 0,
        tokens: 0,

        energy: isFounder ? 9999 : 50,
        freeTries: isFounder ? 9999 : 3,

        proLevel: isFounder ? 4 : 0,
        isPro: isFounder,
        role: isFounder ? "founder" : "user",

        referralsCount: 0,
        referredBy: ref || null,

        tasks: {
          channel: false,
          group: false,
          youtube: false
        }
      });

      // 🎁 REFERRAL BONUS (wallet-based)
      if (ref) {
        const refUser = await User.findOne({ walletAddress: ref });
        if (refUser) {
          refUser.balance += 500;
          refUser.referralsCount += 1;
          await refUser.save();
        }
      }
    }

    res.json({
      userId: user.userId,
      wallet: user.walletAddress,
      balance: user.balance,
      tokens: user.tokens,
      energy: user.energy,
      freeTries: user.freeTries,
      proLevel: user.proLevel,
      role: user.role,
      referralsCount: user.referralsCount
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= OPEN BOX ================= */
app.post("/api/open", async (req, res) => {
  const { userId } = req.body;
  const user = await User.findOne({ userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  if (user.freeTries > 0) user.freeTries--;
  else if (user.energy >= 10) user.energy -= 10;
  else return res.json({ error: "NO_ENERGY" });

  let rewards = [0, 100, 200];
  if (user.proLevel === 2) rewards = [100, 200, 500];
  if (user.proLevel === 3) rewards = [200, 500, 1000];
  if (user.proLevel >= 4) rewards = [500, 1000, 2000];

  const reward = rewards[Math.floor(Math.random() * rewards.length)];
  user.balance += reward;

  await user.save();

  res.json({
    reward,
    balance: user.balance,
    energy: user.energy,
    freeTries: user.freeTries
  });
});

/* ================= DAILY BONUS ================= */
app.post("/api/daily", async (req, res) => {
  const { userId } = req.body;
  const user = await User.findOne({ userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();

  if (user.lastDaily && now - user.lastDaily < DAY)
    return res.json({ error: "COME_BACK_LATER" });

  let reward = 500;
  if (user.proLevel >= 2) reward = 800;
  if (user.proLevel >= 3) reward = 1200;

  user.balance += reward;
  user.energy += 20;
  user.lastDaily = now;

  await user.save();

  res.json({
    reward,
    balance: user.balance,
    energy: user.energy
  });
});

/* ================= WATCH ADS ================= */
app.post("/api/ads/watch", async (req, res) => {
  const { userId } = req.body;
  const user = await User.findOne({ userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const today = new Date().toISOString().slice(0, 10);
  if (user.lastAdDay !== today) {
    user.adsWatchedToday = 0;
    user.lastAdDay = today;
  }

  if (user.adsWatchedToday >= 5)
    return res.json({ error: "DAILY_LIMIT" });

  user.adsWatchedToday += 1;
  user.energy += 20;
  user.balance += 100;

  await user.save();

  res.json({
    energy: user.energy,
    balance: user.balance,
    adsLeft: 5 - user.adsWatchedToday
  });
});

/* ================= TOKEN MARKET ================= */
app.post("/api/token/buy", async (req, res) => {
  const { userId, amount } = req.body;
  const user = await User.findOne({ userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const cost = amount * 10000;
  if (user.balance < cost)
    return res.json({ error: "NOT_ENOUGH_BALANCE" });

  user.balance -= cost;
  user.tokens += amount;
  await user.save();

  res.json({ balance: user.balance, tokens: user.tokens });
});

app.post("/api/token/sell", async (req, res) => {
  const { userId, amount } = req.body;
  const user = await User.findOne({ userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  if (user.tokens < amount)
    return res.json({ error: "NOT_ENOUGH_TOKENS" });

  user.tokens -= amount;
  user.balance += amount * 9000;
  await user.save();

  res.json({ balance: user.balance, tokens: user.tokens });
});

/* ================= WALLET ================= */
app.get("/api/wallet/:userId", async (req, res) => {
  const user = await User.findOne({ userId: req.params.userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  res.json({
    wallet: user.walletAddress,
    tokens: user.tokens
  });
});

app.post("/api/wallet/send", async (req, res) => {
  const { userId, to, amount } = req.body;

  const sender = await User.findOne({ userId });
  const receiver = await User.findOne({ walletAddress: to });

  if (!sender || !receiver)
    return res.json({ error: "INVALID_WALLET" });

  if (sender.tokens < amount)
    return res.json({ error: "INSUFFICIENT_BALANCE" });

  sender.tokens -= amount;
  receiver.tokens += amount;

  await Transaction.create({
    from: sender.walletAddress,
    to,
    amount
  });

  await sender.save();
  await receiver.save();

  res.json({ success: true, tokens: sender.tokens });
});

/* ================= LEADERBOARD ================= */
app.get("/api/leaderboard", async (req, res) => {
  const top = await User.find()
    .sort({ balance: -1 })
    .limit(10)
    .select("userId balance");

  res.json(top);
});

/* ================= FOUNDER DASHBOARD ================= */
app.get("/api/founder/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const proUsers = await User.countDocuments({ proLevel: { $gte: 1 } });
    const founders = await User.countDocuments({ proLevel: { $gte: 4 } });

    const agg = await User.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$balance" },
          totalTokens: { $sum: "$tokens" },
          totalEnergy: { $sum: "$energy" },
          totalReferrals: { $sum: "$referralsCount" }
        }
      }
    ]);

    const stats = agg[0] || {
      totalBalance: 0,
      totalTokens: 0,
      totalEnergy: 0,
      totalReferrals: 0
    };

    res.json({
      totalUsers,
      proUsers,
      founders,
      ...stats
    });

  } catch (err) {
    res.status(500).json({ error: "SERVER_ERROR" });
  }
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

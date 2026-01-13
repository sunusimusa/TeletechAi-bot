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
    if (!userId) return res.json({ error: "INVALID_USER" });

    const isFounder = userId === FOUNDER_USER_ID;
    let user = await User.findOne({ userId });

    /* ========== CREATE USER ========== */
    if (!user) {
      const wallet =
        "TTECH-" + Math.random().toString(36).substring(2, 8).toUpperCase();

      user = await User.create({
        userId,
        walletAddress: wallet,
        role: isFounder ? "founder" : "user",
        proLevel: isFounder ? 4 : 0,
        energy: isFounder ? 9999 : 100,
        freeTries: isFounder ? 9999 : 3,
        balance: 0,
        tokens: 0
      });

      // referral (once, normal users only)
      if (ref && !isFounder) {
        const referrer = await User.findOne({ walletAddress: ref });
        if (referrer && referrer.userId !== userId) {
          user.referredBy = referrer.walletAddress;
          referrer.referrals.push(userId);
          referrer.referralsCount += 1;
          referrer.balance += 500;
          await referrer.save();
          await user.save();
        }
      }
    }

    /* ========== 🔥 FOUNDER FIX (IMPORTANT) ========== */
    if (isFounder) {
      let changed = false;

      if (user.role !== "founder") {
        user.role = "founder";
        changed = true;
      }

      if (user.proLevel < 4) {
        user.proLevel = 4;
        changed = true;
      }

      if (user.energy < 9999) {
        user.energy = 9999;
        changed = true;
      }

      if (user.freeTries < 9999) {
        user.freeTries = 9999;
        changed = true;
      }

      if (changed) await user.save();
    }

    /* ========== RESPONSE ========== */
    res.json({
      success: true,
      userId: user.userId,
      wallet: user.walletAddress,
      balance: user.balance,
      energy: user.energy,
      freeTries: user.freeTries,
      tokens: user.tokens,
      referralsCount: user.referralsCount,
      proLevel: user.proLevel,
      role: user.role
    });

  } catch (err) {
    console.error("USER API ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= OPEN BOX ================= */
app.post("/api/open", async (req, res) => {
  try {
    const { userId, type } = req.body;

    const user = await User.findOne({ userId });
    if (!user) {
      return res.json({ error: "USER_NOT_FOUND" });
    }

    // COST
    if (user.freeTries > 0) {
      user.freeTries -= 1;
    } else if (user.energy >= 10) {
      user.energy -= 10;
    } else {
      return res.json({ error: "NO_ENERGY" });
    }

    // REWARD TABLE
    let rewards = [0, 50, 100];
    if (type === "gold") rewards = [100, 200, 500];
    if (type === "diamond") rewards = [300, 500, 1000, 2000];
    if (user.proLevel >= 3) rewards.push(5000);

    const reward =
      rewards[Math.floor(Math.random() * rewards.length)];

    user.balance += reward;

    await user.save();

    res.json({
      success: true,
      reward,
      balance: user.balance,
      energy: user.energy,
      freeTries: user.freeTries
    });
  } catch (err) {
    console.error("OPEN BOX ERROR", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
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
  try {
    const { userId } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    const today = new Date().toISOString().slice(0, 10);

    // reset daily counter
    if (user.lastAdDay !== today) {
      user.adsWatchedToday = 0;
      user.lastAdDay = today;
    }

    if (user.adsWatchedToday >= 5) {
      return res.json({ error: "DAILY_LIMIT" });
    }

    // mark ad as watched (claimable)
    user.watchAd = true;
    await user.save();

    res.json({ success: true });

  } catch (e) {
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.post("/api/ads/claim", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    if (!user.watchAd) {
      return res.json({ error: "WATCH_FIRST" });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (user.lastAdDay !== today) {
      user.adsWatchedToday = 0;
      user.lastAdDay = today;
    }

    if (user.adsWatchedToday >= 5) {
      return res.json({ error: "DAILY_LIMIT" });
    }

    // REWARD
    user.adsWatchedToday += 1;
    user.energy += 20;
    user.balance += 200;
    user.watchAd = false;

    await user.save();

    res.json({
      success: true,
      energy: user.energy,
      balance: user.balance,
      adsLeft: 5 - user.adsWatchedToday
    });

  } catch (e) {
    res.status(500).json({ error: "SERVER_ERROR" });
  }
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

app.get("/api/my-referrals", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.json([]);

    const user = await User.findOne({ userId });
    if (!user || !user.referrals || user.referrals.length === 0) {
      return res.json([]);
    }

    const referrals = await User.find({
      userId: { $in: user.referrals }
    })
      .select("userId createdAt")
      .sort({ createdAt: -1 });

    res.json(referrals);

  } catch (err) {
    console.error("MY REFERRALS ERROR:", err);
    res.status(500).json([]);
  }
});

app.post("/api/energy/buy", async (req, res) => {
  const { userId, amount } = req.body;
  const user = await User.findOne({ userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const cost = amount === 100 ? 500 : 2000;
  if (user.balance < cost) return res.json({ error: "NO_BALANCE" });

  user.balance -= cost;
  user.energy = Math.min(user.energy + amount, 9999);

  await user.save();
  res.json({ energy: user.energy, balance: user.balance });
});

app.post("/api/pro/upgrade", async (req, res) => {
  const { userId, level } = req.body;
  const user = await User.findOne({ userId });

  if (!user) return res.json({ error: "USER_NOT_FOUND" });
  if (level <= user.proLevel) return res.json({ error: "ALREADY_UPGRADED" });

  user.proLevel = level;
  user.energy = 9999;

  await user.save();
  res.json({ proLevel: user.proLevel, energy: user.energy });
});

app.post("/api/telegram/link", async (req, res) => {
  const { userId, telegramId } = req.body;
  const user = await User.findOne({ userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  user.telegramId = telegramId;
  await user.save();
  res.json({ success: true });
});

app.post("/api/telegram/balance", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "NOT_LINKED" });

  res.json({
    balance: user.balance,
    energy: user.energy,
    tokens: user.tokens
  });
});

app.post("/api/telegram/daily", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "NOT_LINKED" });

  const DAY = 24 * 60 * 60 * 1000;
  if (user.lastDaily && Date.now() - user.lastDaily < DAY)
    return res.json({ error: "WAIT" });

  user.balance += 300; // virtual
  user.lastDaily = Date.now();
  await user.save();

  res.json({ reward: 300 });
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

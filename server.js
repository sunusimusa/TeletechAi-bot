import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import User from "./models/User.js";

dotenv.config();
const app = express();

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

/* ================= CREATE / LOAD USER ================= */
app.post("/api/user", async (req, res) => {
  try {
    const { userId, ref } = req.body;

    if (!userId) {
      return res.json({ error: "INVALID_USER_ID" });
    }

    let user = await User.findOne({ userId });

    // ================= CREATE USER =================
    if (!user) {
      const isFounder = userId === FOUNDER_USER_ID;

      user = await User.create({
        userId,

        balance: 0,
        tokens: 0,

        energy: isFounder ? 9999 : 50,
        freeTries: isFounder ? 9999 : 3,

        proLevel: isFounder ? 4 : 0,
        isPro: isFounder,
        role: isFounder ? "founder" : "user"
      });
    }

    res.json({
      userId: user.userId,
      balance: user.balance,
      tokens: user.tokens,
      energy: user.energy,
      freeTries: user.freeTries,
      proLevel: user.proLevel,
      isPro: user.isPro,
      role: user.role
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

  if (user.freeTries > 0) {
    user.freeTries -= 1;
  } else if (user.energy >= 10) {
    user.energy -= 10;
  } else {
    return res.json({ error: "NO_ENERGY" });
  }

  const rewards = [0, 100, 200, 500];
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
  try {
    const { userId } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    // ❌ already claimed today
    if (user.lastDaily && now - user.lastDaily < DAY) {
      return res.json({ error: "COME_BACK_LATER" });
    }

    // 🔁 streak logic
    if (user.lastDaily && now - user.lastDaily < DAY * 2) {
      user.dailyStreak += 1;
    } else {
      user.dailyStreak = 1;
    }

    // 🎁 reward
    let reward = 500;
    if (user.dailyStreak >= 3) reward = 800;
    if (user.dailyStreak >= 7) reward = 1200;

    user.balance += reward;
    user.energy = Math.min(200, user.energy + 20);
    user.lastDaily = now;

    await user.save();

    res.json({
      reward,
      streak: user.dailyStreak,
      balance: user.balance,
      energy: user.energy
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= WATCH AD ================= */
app.post("/api/ads/watch", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10);

    // 🔁 reset daily counter
    if (user.lastAdDay !== today) {
      user.adsWatchedToday = 0;
      user.lastAdDay = today;
    }

    // 🚫 daily limit
    if (user.adsWatchedToday >= 5) {
      return res.json({ error: "DAILY_LIMIT_REACHED" });
    }

    // ⏱ cooldown (5 minutes)
    if (user.lastAdAt && now - user.lastAdAt < 5 * 60 * 1000) {
      return res.json({ error: "COOLDOWN_ACTIVE" });
    }

    // 🎁 reward
    const rewardEnergy = 20;
    const rewardCoins = 100;

    user.energy = Math.min(200, user.energy + rewardEnergy);
    user.balance += rewardCoins;
    user.adsWatchedToday += 1;
    user.lastAdAt = now;

    await user.save();

    res.json({
      energy: user.energy,
      balance: user.balance,
      rewardEnergy,
      rewardCoins,
      adsLeft: 5 - user.adsWatchedToday
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.post("/api/user", async (req, res) => {
  try {
    const { userId, ref } = req.body;
    if (!userId) return res.json({ error: "INVALID_USER_ID" });

    let user = await User.findOne({ userId });

    if (!user) {
      user = await User.create({
        userId,
        balance: 0,
        energy: 100,
        tokens: 0,
        freeTries: 3,

        referralCode: generateCode(),
        referredBy: ref || null,
        referralsCount: 0
      });

      // 🎁 REFERRAL BONUS (ONCE)
      if (ref) {
        const refUser = await User.findOne({ referralCode: ref });

        if (refUser && refUser.userId !== userId) {
          refUser.balance += 500; // 🎁 reward
          refUser.referralsCount += 1;
          await refUser.save();
        }
      }
    }

    res.json({
      userId: user.userId,
      balance: user.balance,
      energy: user.energy,
      tokens: user.tokens,
      freeTries: user.freeTries,
      referralCode: user.referralCode,
      referralsCount: user.referralsCount
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// ================= BUY TOKEN =================
app.post("/api/token/buy", async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.json({ error: "INVALID_DATA" });
    }

    const user = await User.findOne({ userId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    const PRICE = 10000; // points per token
    const cost = PRICE * amount;

    if (user.balance < cost) {
      return res.json({ error: "NOT_ENOUGH_POINTS" });
    }

    user.balance -= cost;
    user.tokens += amount;

    await user.save();

    res.json({
      balance: user.balance,
      tokens: user.tokens
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// ================= SELL TOKEN =================
app.post("/api/token/sell", async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.json({ error: "INVALID_DATA" });
    }

    const user = await User.findOne({ userId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    if (user.tokens < amount) {
      return res.json({ error: "NOT_ENOUGH_TOKENS" });
    }

    const SELL_PRICE = 9000; // points per token
    const gain = SELL_PRICE * amount;

    user.tokens -= amount;
    user.balance += gain;

    await user.save();

    res.json({
      balance: user.balance,
      tokens: user.tokens
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// ================= WITHDRAW TOKEN =================
app.post("/api/withdraw", async (req, res) => {
  try {
    const { userId, wallet, amount } = req.body;

    if (!userId || !wallet || !amount || amount <= 0) {
      return res.json({ error: "INVALID_DATA" });
    }

    const user = await User.findOne({ userId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    if (user.tokens < amount) {
      return res.json({ error: "NOT_ENOUGH_TOKENS" });
    }

    // cire token
    user.tokens -= amount;

    // rubuta history
    user.withdrawals.push({
      amount,
      wallet,
      status: "pending"
    });

    await user.save();

    res.json({
      success: true,
      tokens: user.tokens,
      message: "Withdraw request submitted"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// ================= LEADERBOARD =================
app.get("/api/leaderboard", async (req, res) => {
  try {
    const topBalance = await User.find()
      .sort({ balance: -1 })
      .limit(10)
      .select("userId balance");

    const topTokens = await User.find()
      .sort({ tokens: -1 })
      .limit(10)
      .select("userId tokens");

    const topReferrals = await User.find()
      .sort({ referralsCount: -1 })
      .limit(10)
      .select("userId referralsCount");

    res.json({
      topBalance,
      topTokens,
      topReferrals
    });
  } catch (err) {
    console.error("❌ leaderboard error:", err);
    res.status(500).json({ error: "FAILED_TO_LOAD_LEADERBOARD" });
  }
});

// ================= OPEN BOX =================
app.post("/api/open", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    // 🎟️ Free try ko energy
    if (user.freeTries > 0) {
      user.freeTries -= 1;
    } else if (user.energy >= 10) {
      user.energy -= 10;
    } else {
      return res.json({ error: "NO_ENERGY" });
    }

    // 🎁 Rewards
    const rewards = [0, 100, 200, 500];
    const reward =
      rewards[Math.floor(Math.random() * rewards.length)];

    user.balance += reward;
    await user.save();

    res.json({
      reward,
      balance: user.balance,
      energy: user.energy,
      freeTries: user.freeTries
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.post("/api/pro/upgrade", async (req, res) => {
  const { userId, level } = req.body;
  const user = await User.findOne({ userId });

  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  if (level === 4)
    return res.json({ error: "FOUNDER_ONLY" });

  const PRICES = { 1: 5, 2: 10, 3: 20 };

  if (!PRICES[level])
    return res.json({ error: "INVALID_LEVEL" });

  if (user.proLevel >= level)
    return res.json({ error: "ALREADY_UPGRADED" });

  if (user.tokens < PRICES[level])
    return res.json({ error: "NOT_ENOUGH_TOKENS" });

  user.tokens -= PRICES[level];
  user.proLevel = level;
  user.isPro = true;

  await user.save();

  res.json({
    success: true,
    proLevel: user.proLevel,
    tokens: user.tokens
  });
});

app.get("/api/founder/stats", async (req, res) => {
  const { userId } = req.query;

  if (userId !== FOUNDER_USER_ID)
    return res.status(403).json({ error: "FORBIDDEN" });

  const totalUsers = await User.countDocuments();
  const totalTokens = await User.aggregate([
    { $group: { _id: null, total: { $sum: "$tokens" } } }
  ]);

  res.json({
    totalUsers,
    totalTokens: totalTokens[0]?.total || 0
  });
});

// ================= WALLET API =================

// fake DB (idan baka da DB yanzu)
let users = {}; 
// example structure:
// users[userId] = { tokens: 10 }

app.get("/api/wallet/:userId", (req, res) => {
  const { userId } = req.params;

  if (!users[userId]) {
    users[userId] = { tokens: 0 };
  }

  res.json({
    success: true,
    tokens: users[userId].tokens
  });
});

app.post("/api/wallet/send", (req, res) => {
  const { userId, to, amount } = req.body;

  if (!userId || !to || !amount) {
    return res.json({ success: false, message: "Invalid data" });
  }

  if (!users[userId]) {
    users[userId] = { tokens: 0 };
  }

  if (users[userId].tokens < amount) {
    return res.json({ success: false, message: "Insufficient balance" });
  }

  // deduct
  users[userId].tokens -= amount;

  // credit receiver (fake)
  if (!users[to]) users[to] = { tokens: 0 };
  users[to].tokens += amount;

  res.json({
    success: true,
    tokens: users[userId].tokens
  });
});

/* ============================
   FOUNDER GLOBAL STATS API
============================ */
app.get("/api/founder/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const totals = await User.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$balance" },
          totalTokens: { $sum: "$tokens" },
          totalEnergy: { $sum: "$energy" },
          totalReferrals: { $sum: "$referrals" }
        }
      }
    ]);

    const data = totals[0] || {
      totalBalance: 0,
      totalTokens: 0,
      totalEnergy: 0,
      totalReferrals: 0
    };

    res.json({
      success: true,
      users: totalUsers,
      balance: data.totalBalance,
      tokens: data.totalTokens,
      energy: data.totalEnergy,
      referrals: data.totalReferrals
    });
  } catch (err) {
    console.error("Founder stats error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load founder stats"
    });
  }
});

/* ============================
   REFERRAL LEADERBOARD API
============================ */
app.get("/api/leaderboard/referrals", async (req, res) => {
  try {
    const topUsers = await User.find(
      { referrals: { $gt: 0 } },
      { userId: 1, referrals: 1 }
    )
      .sort({ referrals: -1 })
      .limit(20);

    res.json({
      success: true,
      users: topUsers
    });
  } catch (err) {
    console.error("Referral leaderboard error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load leaderboard"
    });
  }
});

/* ================= FOUNDER DASHBOARD STATS ================= */
app.get("/api/founder/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const proUsers = await User.countDocuments({
      proLevel: { $gte: 1 }
    });

    const founders = await User.countDocuments({
      proLevel: { $gte: 4 }
    });

    const balancesAgg = await User.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$balance" },
          totalTokens: { $sum: "$tokens" }
        }
      }
    ]);

    const referralsAgg = await User.aggregate([
      {
        $group: {
          _id: null,
          totalReferrals: { $sum: "$referralsCount" }
        }
      }
    ]);

    res.json({
      success: true,
      totalUsers,
      proUsers,
      founders,
      totalBalance: balancesAgg[0]?.totalBalance || 0,
      totalTokens: balancesAgg[0]?.totalTokens || 0,
      totalReferrals: referralsAgg[0]?.totalReferrals || 0
    });

  } catch (err) {
    console.error("Founder stats error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load founder stats"
    });
  }
});

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* ================= START ================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

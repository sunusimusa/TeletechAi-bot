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
        tokens: 0,
        joinedByRef: false,     // 👈 NEW (ƙanƙane)
        lastSyncAt: Date.now()  // 👈 NEW (ƙanƙane)
      });

      // referral (ONCE, normal users only)
      if (ref && !isFounder) {
        const referrer = await User.findOne({ walletAddress: ref });

        if (
          referrer &&
          referrer.userId !== userId &&
          user.joinedByRef === false
        ) {
          user.referredBy = referrer.walletAddress;
          user.joinedByRef = true;

          referrer.referrals.push(userId);
          referrer.referralsCount += 1;
          referrer.balance += 500;

          await referrer.save();
          await user.save();
        }
      }
    } else {
      // 🛑 ANTI-SPAM SYNC (1 second)
      const now = Date.now();
      if (user.lastSyncAt && now - user.lastSyncAt < 1000) {
        return res.json({ error: "TOO_FAST" });
      }
      user.lastSyncAt = now;
      await user.save();
    }

    /* ========== 🔥 FOUNDER FIX ========== */
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
    if (!userId) return res.json({ error: "INVALID_USER" });

    const user = await User.findOne({ userId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    // 🛑 ANTI-SPAM (1.5 seconds)
    const now = Date.now();
    if (user.lastOpenAt && now - user.lastOpenAt < 1500) {
      return res.json({ error: "TOO_FAST" });
    }
    user.lastOpenAt = now;

    // 💸 COST
    if (user.freeTries > 0) {
      user.freeTries -= 1;
    } else if (user.energy >= 10) {
      user.energy -= 10;
    } else {
      return res.json({ error: "NO_ENERGY" });
    }

    // 🎁 REWARD TABLE
    let rewards = [0, 50, 100];
    if (type === "gold") rewards = [100, 200, 500];
    if (type === "diamond") rewards = [300, 500, 1000, 2000];
    if (user.proLevel >= 3) rewards.push(5000);

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
  } catch (err) {
    console.error("OPEN BOX ERROR:", err);
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
    if (!userId) return res.json({ error: "INVALID_USER" });

    const user = await User.findOne({ userId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    const today = new Date().toDateString();

    // 🔄 reset daily ads
    if (user.lastAdDay !== today) {
      user.lastAdDay = today;
      user.adsWatchedToday = 0;
    }

    // ⛔ daily limit
    if (user.adsWatchedToday >= 5) {
      return res.json({ error: "DAILY_AD_LIMIT" });
    }

    // 🛑 30s cooldown
    const now = Date.now();
    if (user.lastAdAt && now - user.lastAdAt < 30000) {
      return res.json({ error: "WAIT_30_SECONDS" });
    }

    // 🎁 REWARD
    user.energy = Math.min(user.energy + 20, 9999);
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

app.post("/api/telegram/link", async (req, res) => {
  const { userId, telegramId } = req.body;

  if (!userId || !telegramId)
    return res.json({ error: "INVALID" });

  const user = await User.findOne({ userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  // prevent hijacking
  if (user.telegramId && user.telegramId !== telegramId)
    return res.json({ error: "ALREADY_LINKED" });

  user.telegramId = telegramId;
  await user.save();

  res.json({ success: true });
});

// 🔗 GET USER BY TELEGRAM
app.post("/api/user/by-telegram", async (req, res) => {
  const { telegramId } = req.body;
  if (!telegramId) return res.json({ error: "INVALID" });

  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "NOT_LINKED" });

  res.json({
    userId: user.userId,
    wallet: user.walletAddress,
    balance: user.balance,
    energy: user.energy,
    tokens: user.tokens,
    referralsCount: user.referralsCount,
    proLevel: user.proLevel,
    role: user.role
  });
});

app.post("/api/convert", async (req, res) => {
  try {
    const { userId, amount } = req.body;

    // 1️⃣ basic validation
    if (!userId || !amount) {
      return res.json({ error: "INVALID_REQUEST" });
    }

    if (amount <= 0) {
      return res.json({ error: "INVALID_AMOUNT" });
    }

    // 2️⃣ find user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.json({ error: "USER_NOT_FOUND" });
    }

    // 3️⃣ anti-spam (3 seconds)
    const now = Date.now();
    if (user.lastConvertAt && now - user.lastConvertAt < 3000) {
      return res.json({ error: "TOO_FAST" });
    }

    // 4️⃣ conversion rule
    const RATE = 10000; // 10,000 balance = 1 TTECH

    if (amount % RATE !== 0) {
      return res.json({ error: "INVALID_CONVERSION_RATE" });
    }

    if (user.balance < amount) {
      return res.json({ error: "INSUFFICIENT_BALANCE" });
    }

    // 5️⃣ calculate tokens
    const tokensToAdd = amount / RATE;

    // 6️⃣ apply conversion
    user.balance -= amount;
    user.tokens += tokensToAdd;
    user.lastConvertAt = now;

    await user.save();

    // 7️⃣ response
    res.json({
      success: true,
      converted: amount,
      tokensAdded: tokensToAdd,
      balance: user.balance,
      tokens: user.tokens
    });

  } catch (err) {
    console.error("CONVERT ERROR:", err);
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

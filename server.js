import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import crypto from "crypto";

dotenv.config();
const app = express();

/* ================= PATH ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= CONFIG ================= */
const FOUNDER_SESSION_ID = "FOUNDER_FIXED_SESSION"; // founder naka
const MAX_ADS_PER_DAY = 5;
const ENERGY_PER_AD = 20;
const OPEN_COST_ENERGY = 10;
const CONVERT_RATE = 10000;

/* ================= MIDDLEWARE ================= */
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

/* ================= USER MODEL ================= */
const userSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true },

  wallet: String,
  role: { type: String, default: "user" }, // user | founder
  proLevel: { type: Number, default: 0 },

  balance: { type: Number, default: 0 },
  tokens: { type: Number, default: 0 },
  energy: { type: Number, default: 100 },
  freeTries: { type: Number, default: 3 },

  referralsCount: { type: Number, default: 0 },

  lastEnergyAt: { type: Number, default: Date.now },
  lastDaily: String,

  lastAdAt: Number,
  lastAdDay: String,
  adsWatchedToday: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

/* ================= HELPERS ================= */
function makeWallet() {
  return "TTECH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getMaxEnergy(user) {
  if (user.proLevel >= 4) return 999;
  if (user.proLevel >= 3) return 300;
  if (user.proLevel >= 2) return 200;
  if (user.proLevel >= 1) return 150;
  return 100;
}

/* ================= AUTO ENERGY ================= */
function regenEnergy(user) {
  const now = Date.now();
  const last = user.lastEnergyAt || now;

  const INTERVAL = 5 * 60 * 1000; // 5 min
  const gained = Math.floor((now - last) / INTERVAL);
  if (gained <= 0) return;

  const maxEnergy = getMaxEnergy(user);
  user.energy = Math.min(user.energy + gained, maxEnergy);
  user.lastEnergyAt = last + gained * INTERVAL;
}

/* ================= GET USER BY SESSION ================= */
async function getUser(req, res) {
  const sessionId = req.cookies.sessionId;
  if (!sessionId) return null;
  return await User.findOne({ sessionId });
}

/* ================= CREATE / SYNC USER ================= */
app.post("/api/user", async (req, res) => {
  try {
    let sessionId = req.cookies.sessionId;
    let user = sessionId ? await User.findOne({ sessionId }) : null;

    if (!user) {
      sessionId = crypto.randomUUID();

      user = await User.create({
        sessionId,
        wallet: makeWallet(),
        role: sessionId === FOUNDER_SESSION_ID ? "founder" : "user",
        proLevel: sessionId === FOUNDER_SESSION_ID ? 4 : 0,
        energy: sessionId === FOUNDER_SESSION_ID ? 999 : 100,
        freeTries: sessionId === FOUNDER_SESSION_ID ? 999 : 3
      });

      res.cookie("sessionId", sessionId, {
        httpOnly: true,
        sameSite: "Lax",
        secure: true
      });
    }

    regenEnergy(user);
    await user.save();

    res.json({
      success: true,
      wallet: user.wallet,
      balance: user.balance,
      energy: user.energy,
      tokens: user.tokens,
      freeTries: user.freeTries,
      proLevel: user.proLevel,
      role: user.role
    });

  } catch (e) {
    console.error("USER ERROR:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= OPEN BOX ================= */
app.post("/api/open", async (req, res) => {
  const user = await getUser(req, res);
  if (!user) return res.json({ error: "NO_SESSION" });

  regenEnergy(user);

  if (user.freeTries > 0) {
    user.freeTries--;
  } else if (user.energy >= OPEN_COST_ENERGY) {
    user.energy -= OPEN_COST_ENERGY;
  } else {
    return res.json({ error: "NO_ENERGY" });
  }

  let rewards = [0, 50, 100];
  if (req.body.type === "gold") rewards = [100, 200, 500];
  if (req.body.type === "diamond") rewards = [300, 500, 1000];
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
});

/* ================= DAILY BONUS ================= */
app.post("/api/daily", async (req, res) => {
  const user = await getUser(req, res);
  if (!user) return res.json({ error: "NO_SESSION" });

  regenEnergy(user);

  const today = todayStr();
  if (user.lastDaily === today)
    return res.json({ error: "COME_BACK_TOMORROW" });

  let rewardBalance = 500;
  let rewardEnergy = 20;

  if (user.proLevel >= 4) {
    rewardBalance = 2000; rewardEnergy = 100;
  } else if (user.proLevel >= 3) {
    rewardBalance = 1200; rewardEnergy = 50;
  } else if (user.proLevel >= 2) {
    rewardBalance = 900; rewardEnergy = 40;
  } else if (user.proLevel >= 1) {
    rewardBalance = 700; rewardEnergy = 30;
  }

  const maxEnergy = getMaxEnergy(user);
  user.balance += rewardBalance;
  user.energy = Math.min(user.energy + rewardEnergy, maxEnergy);
  user.lastDaily = today;

  await user.save();

  res.json({
    success: true,
    balance: user.balance,
    energy: user.energy
  });
});

/* ================= WATCH ADS ================= */
app.post("/api/ads/watch", async (req, res) => {
  const user = await getUser(req, res);
  if (!user) return res.json({ error: "NO_SESSION" });

  regenEnergy(user);

  const today = todayStr();
  if (user.lastAdDay !== today) {
    user.lastAdDay = today;
    user.adsWatchedToday = 0;
  }

  if (user.adsWatchedToday >= MAX_ADS_PER_DAY)
    return res.json({ error: "DAILY_AD_LIMIT" });

  const maxEnergy = getMaxEnergy(user);
  user.energy = Math.min(user.energy + ENERGY_PER_AD, maxEnergy);
  user.balance += 100;
  user.adsWatchedToday++;

  await user.save();

  res.json({
    success: true,
    energy: user.energy,
    balance: user.balance
  });
});

/* ================= CONVERT ================= */
app.post("/api/convert", async (req, res) => {
  const user = await getUser(req, res);
  if (!user) return res.json({ error: "NO_SESSION" });

  if (user.balance < CONVERT_RATE)
    return res.json({ error: "INSUFFICIENT_BALANCE" });

  user.balance -= CONVERT_RATE;
  user.tokens += 1;

  await user.save();

  res.json({
    success: true,
    balance: user.balance,
    tokens: user.tokens
  });
});

/* ================= LEADERBOARD ================= */
app.get("/api/leaderboard", async (req, res) => {
  const type = req.query.type || "balance";

  let sort = { balance: -1 };
  if (type === "tokens") sort = { tokens: -1 };
  if (type === "referrals") sort = { referralsCount: -1 };

  const list = await User.find()
    .sort(sort)
    .limit(20)
    .select("wallet balance tokens referralsCount proLevel");

  res.json({ success: true, list });
});

/* ================= FOUNDER STATS ================= */
app.get("/api/founder/stats", async (req, res) => {
  const user = await getUser(req, res);
  if (!user || user.role !== "founder")
    return res.json({ error: "ACCESS_DENIED" });

  const totalUsers = await User.countDocuments();

  const totals = await User.aggregate([
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

  res.json({
    success: true,
    totalUsers,
    ...(totals[0] || {})
  });
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

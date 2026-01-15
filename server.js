import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

/* ================= PATH ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= CONFIG ================= */
const FOUNDER_USER_ID = "SUNUSI_001";
const MAX_ADS_PER_DAY = 5;
const ENERGY_PER_AD = 20;
const OPEN_COST_ENERGY = 10;
const CONVERT_RATE = 10000;

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

/* ================= USER MODEL ================= */
const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true },

  wallet: String,
  role: { type: String, default: "user" },
  proLevel: { type: Number, default: 0 },

  balance: { type: Number, default: 0 },
  tokens: { type: Number, default: 0 },
  energy: { type: Number, default: 100 },
  freeTries: { type: Number, default: 3 },

  referralsCount: { type: Number, default: 0 },

  lastEnergyAt: { type: Number, default: Date.now },

  lastOpenAt: Number,
  lastDaily: String,

  lastAdAt: Number,
  lastAdDay: String,
  adsWatchedToday: { type: Number, default: 0 },

  lastConvertAt: Number
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

/* ================= AUTO ENERGY REGEN ================= */
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

/* ================= CREATE / SYNC USER ================= */
app.post("/api/user", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.json({ error: "INVALID_USER" });

    let user = await User.findOne({ userId });
    const isFounder = userId === FOUNDER_USER_ID;

    if (!user) {
      user = await User.create({
        userId,
        wallet: makeWallet(),
        role: isFounder ? "founder" : "user",
        proLevel: isFounder ? 4 : 0,
        energy: isFounder ? 999 : 100,
        freeTries: isFounder ? 5 : 3
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
      referralsCount: user.referralsCount,
      role: user.role
    });

  } catch (e) {
    console.error("USER ERROR:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= OPEN BOX ================= */
app.post("/api/open", async (req, res) => {
  try {
    const { userId, type } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    regenEnergy(user);

    if (user.freeTries > 0) {
      user.freeTries--;
    } else if (user.energy >= OPEN_COST_ENERGY) {
      user.energy -= OPEN_COST_ENERGY;
    } else {
      return res.json({ error: "NO_ENERGY" });
    }

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

/* ================= DAILY BONUS ================= */
app.post("/api/daily", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

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
      energy: user.energy,
      rewardBalance,
      rewardEnergy
    });

  } catch (e) {
    console.error("DAILY ERROR:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= WATCH ADS ================= */
app.post("/api/ads/watch", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

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

  } catch (e) {
    console.error("ADS ERROR:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= CONVERT ================= */
app.post("/api/convert", async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    if (amount !== CONVERT_RATE)
      return res.json({ error: "INVALID_AMOUNT" });

    if (user.balance < amount)
      return res.json({ error: "INSUFFICIENT_BALANCE" });

    user.balance -= amount;
    user.tokens += 1;
    await user.save();

    res.json({
      success: true,
      balance: user.balance,
      tokens: user.tokens
    });

  } catch (e) {
    console.error("CONVERT ERROR:", e);
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

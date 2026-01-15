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
  role: { type: String, default: "user" }, // user | founder
  proLevel: { type: Number, default: 0 },

  balance: { type: Number, default: 0 },
  tokens: { type: Number, default: 0 },
  energy: { type: Number, default: 100 },
  freeTries: { type: Number, default: 3 },

  referralsCount: { type: Number, default: 0 },

  lastOpenAt: Number,
  lastDaily: Number,

  lastEnergyAt: Number,

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
        proLevel: isFounder ? 3 : 0,
        energy: isFounder ? 999 : 100,
        freeTries: isFounder ? 999 : 3
      });
    }

    // enforce founder limits
    if (isFounder) {
      if (user.role !== "founder") user.role = "founder";
      if (user.energy > 999) user.energy = 999;
      await user.save();
    }

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

    const now = Date.now();
    if (user.lastOpenAt && now - user.lastOpenAt < 1500)
      return res.json({ error: "TOO_FAST" });

    user.lastOpenAt = now;

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
  const { userId } = req.body;
  const user = await User.findOne({ userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const DAY = 24 * 60 * 60 * 1000;
  if (user.lastDaily && Date.now() - user.lastDaily < DAY)
    return res.json({ error: "WAIT" });

  user.balance += 500;
  user.energy = Math.min(user.energy + 20, user.role === "founder" ? 999 : 100);
  user.lastDaily = Date.now();

  await user.save();

  res.json({
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

    const today = todayStr();
    if (user.lastAdDay !== today) {
      user.lastAdDay = today;
      user.adsWatchedToday = 0;
    }

    if (user.adsWatchedToday >= MAX_ADS_PER_DAY)
      return res.json({ error: "DAILY_AD_LIMIT" });

    const now = Date.now();
    if (user.lastAdAt && now - user.lastAdAt < 30000)
      return res.json({ error: "WAIT_30_SECONDS" });

    const maxEnergy = user.role === "founder" ? 999 : 100;
    user.energy = Math.min(user.energy + ENERGY_PER_AD, maxEnergy);
    user.balance += 100;
    user.adsWatchedToday++;
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
    user.lastConvertAt = Date.now();

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

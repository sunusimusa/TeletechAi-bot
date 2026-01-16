import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();

/* ================= PATH ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= CONFIG ================= */
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
  userId: { type: String, unique: true },
  sessionId: { type: String, unique: true },

  walletAddress: String,

  role: { type: String, default: "user" }, // user | founder
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
  return "TTECH-" + crypto.randomBytes(4).toString("hex").toUpperCase();
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

function regenEnergy(user) {
  const now = Date.now();
  const last = user.lastEnergyAt || now;

  const INTERVAL = 5 * 60 * 1000; // 5 minutes
  const gained = Math.floor((now - last) / INTERVAL);
  if (gained <= 0) return;

  user.energy = Math.min(
    user.energy + gained,
    getMaxEnergy(user)
  );

  user.lastEnergyAt = last + gained * INTERVAL;
}

/* ================= CREATE / SYNC USER ================= */
app.post("/api/user", async (req, res) => {
  try {
    let user = null;
    let sid = req.cookies.sid;

    // 1. find by session
    if (sid) {
      user = await User.findOne({ sessionId: sid });
    }

    // 2. create new user
    if (!user) {
      sid = crypto.randomUUID();

      // 🔑 karɓi referral daga URL
      const ref = req.query.ref || null;

      user = await User.create({
        userId: "USER_" + Date.now(),
        sessionId: sid,
        walletAddress: makeWallet(),
        energy: 100,
        freeTries: 3,
        referredBy: ref && ref !== "null" ? ref : null
      });
      
     res.cookie("sid", sid, {
       httpOnly: true,
       sameSite: "None",   // 🔴 MUHIMMI
       secure: true        // 🔴 MUHIMMI (Render = HTTPS)
     });

      // 🎁 referral bonus (sau ɗaya)
      if (ref && ref !== "null") {
        const inviter = await User.findOne({ userId: ref });
        if (inviter) {
          inviter.referralsCount += 1;
          inviter.balance += 500; // referral bonus
          await inviter.save();
        }
      }
    }

    regenEnergy(user);
    await user.save();

    res.json({
      success: true,
      userId: user.userId,
      wallet: user.walletAddress,
      balance: user.balance,
      tokens: user.tokens,
      energy: user.energy,
      freeTries: user.freeTries,
      proLevel: user.proLevel,
      role: user.role,
      referralsCount: user.referralsCount || 0,
      maxEnergy: getMaxEnergy(user)
    });

  } catch (e) {
    console.error("USER ERROR:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= OPEN BOX ================= */
app.post("/api/open", async (req, res) => {
  try {
    const sid = req.cookies.sid;

    if (!sid) {
      return res.status(401).json({ error: "NO_SESSION" });
    }

    const user = await User.findOne({ sessionId: sid });
    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    // ⚡ auto energy regen
    regenEnergy(user);

    // 🎟️ cost
    const OPEN_COST = 10;

    if (user.freeTries > 0) {
      user.freeTries -= 1;
    } else if (user.energy >= OPEN_COST) {
      user.energy -= OPEN_COST;
    } else {
      return res.json({ error: "NO_ENERGY" });
    }

    // 🧱 SAFE TYPE
    const type = req.body?.type || "silver";

    // 🎁 rewards
    let rewards = [0, 50, 100];
    if (type === "gold") rewards = [100, 200, 500];
    if (type === "diamond") rewards = [300, 500, 1000];

    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    user.balance += reward;

    await user.save();

    // ✅ JSON RESPONSE ONLY
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

// ===== DAILY BONUS (24h cooldown) =====
app.post("/api/daily", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) return res.json({ error: "NO_SESSION" });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    const now = Date.now();
    const COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

    // ⏳ cooldown check
    if (user.lastDaily && now - user.lastDaily < COOLDOWN) {
      return res.json({
        error: "COOLDOWN",
        remaining: COOLDOWN - (now - user.lastDaily)
      });
    }

    // 🎁 rewards
    const rewardBalance = 500;
    const rewardEnergy = 20;

    user.balance += rewardBalance;
    user.energy = Math.min(user.energy + rewardEnergy, getMaxEnergy(user));
    user.lastDaily = now;

    await user.save();

    res.json({
      success: true,
      balance: user.balance,
      energy: user.energy,
      rewardBalance,
      rewardEnergy,
      nextAt: now + COOLDOWN
    });

  } catch (e) {
    console.error("DAILY ERROR:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= WATCH ADS ================= */
app.post("/api/ads/watch", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    regenEnergy(user);

    const today = todayStr();
    if (user.lastAdDay !== today) {
      user.lastAdDay = today;
      user.adsWatchedToday = 0;
    }

    if (user.adsWatchedToday >= MAX_ADS_PER_DAY)
      return res.json({ error: "DAILY_AD_LIMIT" });

    user.energy = Math.min(
      user.energy + ENERGY_PER_AD,
      getMaxEnergy(user)
    );
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
    const sid = req.cookies.sid;
    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

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

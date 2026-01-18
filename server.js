import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/User.js";

const app = express();

/* ================= PATH FIX ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: true,
  credentials: true
}));

/* ================= SERVE FRONTEND ================= */
app.use(express.static(path.join(__dirname, "public")));

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================= DB ================= */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error", err));
/* ================= API: USER INIT ================= */
app.post("/api/user", async (req, res) => {
  try {
    let sid = req.cookies.sid;
    let user = null;

    // 📅 today string (don daily)
    const TODAY_STRING = new Date().toISOString().slice(0, 10);

    // 1️⃣ Idan akwai session → nemo user
    if (sid) {
      user = await User.findOne({ sessionId: sid });
    }

    // 2️⃣ Idan babu user → ƙirƙiri sabo
    if (!user) {
      sid = crypto.randomUUID();

      user = await User.create({
        userId: "USER_" + Date.now(),
        sessionId: sid,

        balance: 0,
        energy: 0,

        freeTries: 5,        // 🎁 FREE OPEN ×5
        lastDaily: ""        // don daily energy
      });

      // 🍪 COOKIE (Render + Android WebView SAFE)
      res.cookie("sid", sid, {
        httpOnly: true,
        sameSite: "lax",     // ✅ mafi aminci
        secure: process.env.NODE_ENV === "production",
        path: "/"
      });
    }

    // 3️⃣ Response (SOURCE OF TRUTH)
    res.json({
      success: true,

      userId: user.userId,
      balance: user.balance,
      energy: user.energy,
      freeTries: user.freeTries,

      // 🗓️ daily status
      dailyClaimed: user.lastDaily === TODAY_STRING
    });

  } catch (err) {
    console.error("USER ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

function todayString() {
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate();
}

function getScratchReward() {
  const roll = Math.random() * 100;

  if (roll < 40) return { points: 10, energy: 0 };
  if (roll < 65) return { points: 20, energy: 0 };
  if (roll < 80) return { points: 50, energy: 0 };
  if (roll < 90) return { points: 0, energy: 10 };
  if (roll < 98) return { points: 0, energy: 20 };

  // 🎉 JACKPOT
  return { points: 100, energy: 0 };
}

app.post("/api/scratch", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) {
      return res.status(401).json({ error: "NO_SESSION" });
    }

    const user = await User.findOne({ sessionId: sid });
    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    const today = todayString();

    // 🔁 reset daily count
    if (user.lastScratchDay !== today) {
      user.lastScratchDay = today;
      user.scratchToday = 0;
    }

    // 🚫 daily limit
    if (user.scratchToday >= 5) {
      return res.json({ error: "SCRATCH_LIMIT_REACHED" });
    }

    const mode = req.body?.mode || "ad"; 
    // mode = "ad" | "energy" | "daily"

    // 🎁 DAILY FREE (1x)
    if (mode === "daily") {
      if (user.scratchToday > 0) {
        return res.json({ error: "DAILY_ALREADY_USED" });
      }
    }

    // ⚡ ENERGY MODE
    if (mode === "energy") {
      if (user.energy < 20) {
        return res.json({ error: "NO_ENERGY" });
      }
      user.energy -= 20;
    }

    // 🎁 GET REWARD
    const reward = getScratchReward();

    user.balance += reward.points;
    user.energy += reward.energy;
    user.scratchToday += 1;

    await user.save();

    res.json({
      success: true,
      reward,
      scratchLeft: Math.max(0, 5 - user.scratchToday),
      balance: user.balance,
      energy: user.energy
    });

  } catch (err) {
    console.error("SCRATCH ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= API: WATCH AD (ENERGY ONLY) ================= */
app.post("/api/ads/watch", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) {
      return res.status(401).json({ error: "NO_SESSION" });
    }

    const user = await User.findOne({ sessionId: sid });
    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    // 📅 yau (don iyaka ads/day idan ka so daga baya)
    const TODAY = new Date().toISOString().slice(0, 10);

    // 🧠 reset idan sabuwar rana
    if (user.lastAdDay !== TODAY) {
      user.adsWatchedToday = 0;
      user.lastAdDay = TODAY;
    }

    // ⛔ iyaka (misali 10 ads / day)
    const MAX_ADS_PER_DAY = 10;
    if (user.adsWatchedToday >= MAX_ADS_PER_DAY) {
      return res.json({ error: "ADS_LIMIT_REACHED" });
    }

    // ⚡ ENERGY REWARD
    const ENERGY_REWARD = 20;

    user.energy += ENERGY_REWARD;
    user.adsWatchedToday += 1;

    await user.save();

    res.json({
      success: true,
      added: ENERGY_REWARD,
      energy: user.energy,
      adsWatchedToday: user.adsWatchedToday
    });

  } catch (err) {
    console.error("ADS WATCH ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= OPEN BOX ================= */
app.post("/api/open", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) return res.json({ error: "NO_SESSION" });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    const OPEN_COST = 10;
    let usedFree = false;

    // 🟢 FREE TRIES FARKO
    if (user.freeTries > 0) {
      user.freeTries -= 1;
      usedFree = true;

    // 🔋 ENERGY OPEN
    } else if (user.energy >= OPEN_COST) {
      user.energy -= OPEN_COST;

    } else {
      return res.json({ error: "NO_ENERGY" });
    }

    // 🎁 REWARD
    const rewards = [0, 50, 100];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    user.balance += reward;

    // 🔐 MUHIMMI
    await user.save();

    return res.json({
      success: true,
      reward,
      balance: user.balance,
      energy: user.energy,
      freeTries: user.freeTries,
      usedFree
    });

  } catch (err) {
    console.error("OPEN ERROR:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.post("/api/daily-energy", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) {
      return res.json({ error: "NO_SESSION" });
    }

    const user = await User.findOne({ sessionId: sid });
    if (!user) {
      return res.json({ error: "NO_USER" });
    }

    // 📅 RANAR YAU (YYYY-MM-DD)
    const today = new Date().toISOString().slice(0, 10);

    // ❌ an riga an karɓa yau
    if (user.lastDaily === today) {
      return res.json({
        error: "DAILY_ALREADY_CLAIMED",
        next: "tomorrow"
      });
    }

    // ✅ bayarwa sau 1
    const DAILY_ENERGY = 50;

    user.energy += DAILY_ENERGY;
    user.lastDaily = today;

    await user.save();

    res.json({
      success: true,
      added: DAILY_ENERGY,
      energy: user.energy,
      date: today
    });

  } catch (err) {
    console.error("DAILY ENERGY ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= START ================= */
app.listen(3000, () =>
  console.log("🚀 Server running")
);

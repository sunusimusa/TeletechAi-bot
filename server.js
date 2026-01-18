import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/User.js";

const app = express();

/* ================= PATH ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

/* ================= STATIC ================= */
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

/* ================= DB ================= */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error", err));

/* ================= HELPERS ================= */
const todayString = () => new Date().toISOString().slice(0, 10);

/* ================= USER INIT ================= */
app.post("/api/user", async (req, res) => {
  try {
    let sid = req.cookies.sid;
    let user = sid ? await User.findOne({ sessionId: sid }) : null;

    if (!user) {
      sid = crypto.randomUUID();

      user = await User.create({
        userId: "USER_" + Date.now(),
        sessionId: sid,
        balance: 0,
        energy: 0,
        freeTries: 5,           // 🎁 free opens
        scratchLeft: 3,
        scratchUnlocked: false,
        lastDaily: ""
      });

      res.cookie("sid", sid, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/"
      });
    }

    res.json({
      success: true,
      userId: user.userId,
      balance: user.balance,
      energy: user.energy,
      freeTries: user.freeTries,
      scratchLeft: user.scratchLeft,
      scratchUnlocked: user.scratchUnlocked,
      dailyClaimed: user.lastDaily === todayString()
    });

  } catch (err) {
    console.error("USER ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= ADS = ENERGY + UNLOCK SCRATCH ================= */
app.post("/api/ads/watch", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) return res.status(401).json({ error: "NO_SESSION" });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

    const TODAY = todayString();

    if (user.lastAdDay !== TODAY) {
      user.adsWatchedToday = 0;
      user.lastAdDay = TODAY;
    }

    const MAX_ADS = 10;
    if (user.adsWatchedToday >= MAX_ADS) {
      return res.json({ error: "ADS_LIMIT_REACHED" });
    }

    user.adsWatchedToday += 1;
    user.energy += 20;              // ⚡ energy
    user.scratchUnlocked = true;    // 🎟️ unlock scratch

    await user.save();

    res.json({
      success: true,
      energy: user.energy,
      scratchUnlocked: true,
      adsWatchedToday: user.adsWatchedToday
    });

  } catch (err) {
    console.error("ADS ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= SCRATCH ================= */
app.post("/api/scratch", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) return res.status(401).json({ error: "NO_SESSION" });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

    if (!user.scratchUnlocked)
      return res.json({ error: "WATCH_AD_FIRST" });

    if (user.scratchLeft <= 0)
      return res.json({ error: "NO_SCRATCH_LEFT" });

    const rewards = [
      { points: 10, energy: 0 },
      { points: 20, energy: 0 },
      { points: 50, energy: 10 },
      { points: 0, energy: 20 }
    ];

    const reward = rewards[Math.floor(Math.random() * rewards.length)];

    user.balance += reward.points;
    user.energy += reward.energy;
    user.scratchLeft -= 1;
    user.scratchUnlocked = false;

    await user.save();

    res.json({
      success: true,
      reward,
      scratchLeft: user.scratchLeft,
      balance: user.balance,
      energy: user.energy
    });

  } catch (err) {
    console.error("SCRATCH ERROR:", err);
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

    const COST = 10;
    let usedFree = false;

    if (user.freeTries > 0) {
      user.freeTries--;
      usedFree = true;
    } else if (user.energy >= COST) {
      user.energy -= COST;
    } else {
      return res.json({ error: "NO_ENERGY" });
    }

    const rewards = [0, 50, 100];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    user.balance += reward;

    await user.save();

    res.json({
      success: true,
      reward,
      balance: user.balance,
      energy: user.energy,
      freeTries: user.freeTries,
      usedFree
    });

  } catch (err) {
    console.error("OPEN ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= DAILY ENERGY ================= */
app.post("/api/daily-energy", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) return res.json({ error: "NO_SESSION" });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ error: "NO_USER" });

    const today = todayString();
    if (user.lastDaily === today) {
      return res.json({ error: "DAILY_ALREADY_CLAIMED" });
    }

    const DAILY = 50;
    user.energy += DAILY;
    user.lastDaily = today;

    await user.save();

    res.json({
      success: true,
      added: DAILY,
      energy: user.energy
    });

  } catch (err) {
    console.error("DAILY ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= START ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("🚀 Server running on", PORT)
);

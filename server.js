import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import User from "./models/User.js";

dotenv.config();

const app = express();

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 SERVE FRONTEND
app.use(express.static(path.join(__dirname, "public")));

// 🔥 ROOT ROUTE
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================= CORE MIDDLEWARE ================= */
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: true,
  credentials: true
}));


/* ================= DB ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error", err));

/* ================= HELPERS ================= */
function makeWallet() {
  return "TTECH-" + crypto.randomBytes(4).toString("hex").toUpperCase();
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
  const interval = 5 * 60 * 1000; // 5 min

  const gained = Math.floor((now - last) / interval);
  if (gained > 0) {
    user.energy = Math.min(user.energy + gained, getMaxEnergy(user));
    user.lastEnergyAt = last + gained * interval;
  }
}

/* ================= API USER ================= */
app.post("/api/user", async (req, res) => {
  try {
    let sid = req.cookies.sid;
    let user = null;

    if (sid) {
      user = await User.findOne({ sessionId: sid });
    }

    if (!user) {
      sid = crypto.randomUUID();

      user = await User.create({
        userId: "USER_" + Date.now(),
        sessionId: sid,
        walletAddress: makeWallet(),
        energy: 100,
        freeTries: 3
      });

      // 🔥 COOKIE (MUHIMMI)
      res.cookie("sid", sid, {
        httpOnly: true,
        sameSite: "none",
        secure: true
      });
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
      maxEnergy: getMaxEnergy(user)
    });

  } catch (err) {
    console.error("USER ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= API OPEN BOX ================= */
app.post("/api/open", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) return res.status(401).json({ error: "NO_SESSION" });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

    regenEnergy(user);

    const COST = 10;
    if (user.freeTries > 0) {
      user.freeTries--;
    } else if (user.energy >= COST) {
      user.energy -= COST;
    } else {
      return res.json({ error: "NO_ENERGY" });
    }

    const type = req.body?.type || "silver";

    let rewards = [0, 50, 100];
    if (type === "gold") rewards = [100, 200, 500];
    if (type === "diamond") rewards = [300, 500, 1000];

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
    console.error("OPEN ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= START ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("🚀 Server running on", PORT)
);

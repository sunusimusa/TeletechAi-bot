import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/User.js";
import crypto from "crypto";

dotenv.config();
const app = express();

/* ===== PATH ===== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===== CONFIG ===== */
const FOUNDER_USER_ID = "SUNUSI_001";
const MAX_ADS_PER_DAY = 5;
const ENERGY_PER_AD = 20;
const OPEN_COST_ENERGY = 10;
const CONVERT_RATE = 10000;

/* ===== MIDDLEWARE ===== */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ===== DB ===== */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

/* ===== HELPERS ===== */
const todayStr = () => new Date().toISOString().slice(0, 10);

function maxEnergy(user) {
  if (user.proLevel >= 4) return 999;
  if (user.proLevel >= 3) return 300;
  if (user.proLevel >= 2) return 200;
  if (user.proLevel >= 1) return 150;
  return 100;
}

function regenEnergy(user) {
  const now = Date.now();
  const last = user.lastEnergyAt || now;
  const interval = 5 * 60 * 1000;
  const gained = Math.floor((now - last) / interval);
  if (gained <= 0) return;

  user.energy = Math.min(user.energy + gained, maxEnergy(user));
  user.lastEnergyAt = last + gained * interval;
}

/* ===== CREATE / SYNC USER ===== */
app.post("/api/user", async (req, res) => {
  try {
    let { userId } = req.body;

    // ✅ idan frontend bai turo ba, server zai ƙirƙira
    if (!userId) {
      userId = "USER_" + crypto.randomUUID().slice(0, 8);
    }

    let user = await User.findOne({ userId });

    if (!user) {
      user = await User.create({
        userId,
        role: userId === FOUNDER_USER_ID ? "founder" : "user",
        proLevel: userId === FOUNDER_USER_ID ? 4 : 0,
        energy: userId === FOUNDER_USER_ID ? 999 : 100,
        freeTries: userId === FOUNDER_USER_ID ? 999 : 3
      });
    }

    regenEnergy(user);
    await user.save();

    res.json({
      success: true,
      userId: user.userId, // 👈 MUHIMMI
      balance: user.balance,
      tokens: user.tokens,
      freeTries: user.freeTries,
      energy: user.energy,
      maxEnergy: maxEnergy(user),
      role: user.role,
      proLevel: user.proLevel
    });

  } catch (e) {
    console.error("USER ERROR:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ===== FOUNDER STATS ===== */
app.get("/api/founder/stats", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.json({ error: "NO_USER" });

  const founder = await User.findOne({ userId });
  if (!founder || founder.role !== "founder")
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

/* ===== ROOT ===== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* ===== START ===== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

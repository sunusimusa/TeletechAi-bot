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

    if (!userId) return res.json({ error: "INVALID_USER" });

    let user = await User.findOne({ userId });

    if (!user) {
      user = await User.create({
        userId,
        walletAddress: await generateWalletUnique(),
        referralCode: generateCode(),
        referredBy: ref || null,
        balance: 0,
        energy: 100,
        tokens: 0,
        freeTries: 3
      });
    }

    res.json({
      userId: user.userId,
      walletAddress: user.walletAddress,
      balance: user.balance,
      energy: user.energy,
      tokens: user.tokens,
      freeTries: user.freeTries,
      referralCode: user.referralCode
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

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* ================= START ================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

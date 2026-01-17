import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/User.js";

dotenv.config();

const app = express();

/* ================= PATH ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: true,
  credentials: true
}));

/* ================= STATIC ================= */
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================= DB ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error", err));

/* ================= HELPERS ================= */
function createUser() {
  return {
    userId: "USER_" + crypto.randomUUID().slice(0, 8),
    sessionId: crypto.randomUUID(),
    balance: 0,
    energy: 0, // ❗ energy daga ads kawai
  };
}

/* ================= API USER ================= */
app.post("/api/user", async (req, res) => {
  try {
    let sid = req.cookies.sid;
    let user;

    if (sid) {
      user = await User.findOne({ sessionId: sid });
    }

    if (!user) {
      sid = crypto.randomUUID();

      user = await User.create({
        userId: "USER_" + Date.now(),
        sessionId: sid,
        balance: 0,
        energy: 0,
        referralsCount: 0
      });

      res.cookie("sid", sid, {
        httpOnly: true,
        sameSite: "none",
        secure: true
      });
    }

    res.json({
      success: true,
      userId: user.userId,
      balance: user.balance,
      energy: user.energy,
      referralsCount: user.referralsCount
    });

  } catch (e) {
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

    if (user.energy < 1) {
      return res.json({ error: "NO_ENERGY" });
    }

    // 🔥 consume energy
    user.energy -= 1;

    // 🎁 reward (simple & safe)
    const rewards = [0, 50, 100];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    user.balance += reward;

    await user.save();

    res.json({
      success: true,
      reward,
      balance: user.balance,
      energy: user.energy
    });

  } catch (err) {
    console.error("OPEN ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= API WATCH AD ================= */
app.post("/api/watch-ad", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) return res.status(401).json({ error: "NO_SESSION" });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

    // 🎬 reward energy
    user.energy += 1;
    await user.save();

    res.json({
      success: true,
      energy: user.energy
    });

  } catch (err) {
    console.error("AD ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= START ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});

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
        balance: 0,
        energy: 0,
        freeTries: 5   // 🎁 FREE OPEN ×5
      });

      res.cookie("sid", sid, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/"
      });
    }

    res.json({
      success: true,
      userId: user.userId,
      balance: user.balance,
      energy: user.energy,
      freeTries: user.freeTries
    });

  } catch (err) {
    console.error("USER ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= WATCH AD ================= */
app.post("/api/ads/watch", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) return res.json({ error: "NO_SESSION" });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    const ENERGY_REWARD = 10;

    user.energy += ENERGY_REWARD;
    await user.save();

    res.json({
      success: true,
      energy: user.energy
    });

  } catch (err) {
    console.error("ADS ERROR:", err);
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
    if (!sid) return res.json({ error: "NO_SESSION" });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    if (user.lastDailyEnergy === today) {
      return res.json({ error: "ALREADY_CLAIMED" });
    }

    user.energy += 50;
    user.lastDailyEnergy = today;
    await user.save();

    res.json({
      success: true,
      energy: user.energy
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

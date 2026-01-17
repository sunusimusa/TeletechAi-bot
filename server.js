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

    // 1️⃣ find user by session
    if (sid) {
      user = await User.findOne({ sessionId: sid });
    }

    // 2️⃣ create user automatically if not found
    if (!user) {
      sid = crypto.randomUUID();

      user = await User.create({
        userId: "USER_" + Date.now(),
        sessionId: sid,
        balance: 0,
        energy: 0
      });

      // 🍪 set cookie
      res.cookie("sid", sid, {
        httpOnly: true,
        sameSite: "lax",   // ✅ daidai
        secure: true,      // Render = https
        path: "/"
      });
    }

    // 3️⃣ RESPONSE (KO DA TSOHO KO SABO)
    res.json({
      success: true,
      userId: user.userId,
      balance: user.balance,
      energy: user.energy
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
    if (!sid) {
      return res.status(401).json({ error: "NO_SESSION" });
    }

    const user = await User.findOne({ sessionId: sid });
    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    // 🎥 REWARD FROM AD
    const ENERGY_REWARD = 5;
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
    if (!user) return res.json({ error: "NO_USER" });

    if (user.energy <= 0) {
      return res.json({ error: "NO_ENERGY" });
    }

    user.energy -= 1;

    const reward = Math.random() < 0.7 ? 0 : 100;
    user.balance += reward;

    await user.save();

    res.json({
      success: true,
      reward,
      balance: user.balance,
      energy: user.energy
    });

  } catch {
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= START ================= */
app.listen(3000, () =>
  console.log("🚀 Server running")
);

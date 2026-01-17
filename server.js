import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import User from "./models/User.js";

const app = express();

/* ================= MIDDLEWARE ================= */
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

/* ================= API USER ================= */
app.post("/api/user", async (req, res) => {
  try {
    let sid = req.cookies.sid;
    let user = null;

    if (sid) {
      user = await User.findOne({ sessionId: sid });
    }

    // 🔥 create user automatically
    if (!user) {
      sid = crypto.randomUUID();

      user = await User.create({
        userId: "USER_" + Date.now(),
        sessionId: sid,
        balance: 0,
        energy: 0
      });

      // ⚠️ SIMPLE COOKIE
      res.cookie("sid", sid, {
        httpOnly: true,
        sameSite: "lax"
      });
    }

    res.json({
      success: true,
      balance: user.balance,
      energy: user.energy,
      userId: user.userId
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
    if (!user) return res.json({ error: "NO_USER" });

    user.energy += 1; // 🔋 energy from ad
    await user.save();

    res.json({ success: true, energy: user.energy });

  } catch {
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

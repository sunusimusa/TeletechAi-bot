import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

/* ================= BASIC SETUP ================= */
const FOUNDER_USER_ID = "SUNUSI_001";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

/* ================= USER MODEL ================= */
const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  role: { type: String, default: "user" },

  balance: { type: Number, default: 0 },
  tokens: { type: Number, default: 0 },

  energy: { type: Number, default: 100 },
  freeTries: { type: Number, default: 3 },

  adsWatchedToday: { type: Number, default: 0 },
  lastAdDay: String,
  lastAdAt: Number,

  lastDaily: Number,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

/* ================= CREATE / SYNC USER ================= */
app.post("/api/user", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.json({ error: "INVALID_USER" });

    let user = await User.findOne({ userId });

    if (!user) {
      const isFounder = userId === FOUNDER_USER_ID;

      user = await User.create({
        userId,
        role: isFounder ? "founder" : "user",
        energy: isFounder ? 999 : 100,
        freeTries: isFounder ? 999 : 3
      });
    }

    res.json({
      success: true,
      balance: user.balance,
      tokens: user.tokens,
      energy: user.energy,
      freeTries: user.freeTries,
      role: user.role
    });
  } catch (e) {
    console.error("USER ERROR:", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= OPEN BOX ================= */
app.post("/api/open", async (req, res) => {
  try {
    const { userId, type } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    if (user.freeTries > 0) {
      user.freeTries--;
    } else if (user.energy >= 10) {
      user.energy -= 10;
    } else {
      return res.json({ error: "NO_ENERGY" });
    }

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
  } catch (e) {
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= DAILY BONUS ================= */
app.post("/api/daily", async (req, res) => {
  const { userId } = req.body;
  const user = await User.findOne({ userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const DAY = 24 * 60 * 60 * 1000;
  if (user.lastDaily && Date.now() - user.lastDaily < DAY) {
    return res.json({ error: "WAIT" });
  }

  user.balance += 500;
  user.energy = Math.min(user.energy + 20, 999);
  user.lastDaily = Date.now();

  await user.save();

  res.json({
    balance: user.balance,
    energy: user.energy
  });
});

/* ================= WATCH ADS ================= */
app.post("/api/ads/watch", async (req, res) => {
  const { userId } = req.body;
  const user = await User.findOne({ userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const today = new Date().toDateString();
  if (user.lastAdDay !== today) {
    user.lastAdDay = today;
    user.adsWatchedToday = 0;
  }

  if (user.adsWatchedToday >= 5)
    return res.json({ error: "DAILY_AD_LIMIT" });

  const now = Date.now();
  if (user.lastAdAt && now - user.lastAdAt < 30000)
    return res.json({ error: "WAIT_30_SECONDS" });

  user.energy = Math.min(user.energy + 20, 999);
  user.balance += 100;
  user.adsWatchedToday++;
  user.lastAdAt = now;

  await user.save();

  res.json({
    success: true,
    energy: user.energy,
    balance: user.balance
  });
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

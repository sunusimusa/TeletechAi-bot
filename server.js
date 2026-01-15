import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();

/* ================= CONFIG ================= */
const FOUNDER_USER_ID = "SUNUSI_001";

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error", err));

/* ================= USER MODEL ================= */
const userSchema = new mongoose.Schema({
  userId: String,
  role: { type: String, default: "user" },
  balance: { type: Number, default: 0 },
  energy: { type: Number, default: 100 },
  freeTries: { type: Number, default: 3 },
  tokens: { type: Number, default: 0 },
  lastAdAt: Number,
  adsWatchedToday: { type: Number, default: 0 },
  lastAdDay: String,
  lastDaily: Number
});

const User = mongoose.model("User", userSchema);

/* ================= CREATE / SYNC USER ================= */
app.post("/api/user", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.json({ error: "INVALID_USER" });

  let user = await User.findOne({ userId });

  if (!user) {
    const isFounder = userId === FOUNDER_USER_ID;
    user = await User.create({
      userId,
      role: isFounder ? "founder" : "user",
      energy: isFounder ? 9999 : 100,
      freeTries: isFounder ? 9999 : 3
    });
  }

  res.json({
    success: true,
    balance: user.balance,
    energy: user.energy,
    freeTries: user.freeTries,
    tokens: user.tokens,
    role: user.role
  });
});

/* ================= OPEN BOX ================= */
app.post("/api/open", async (req, res) => {
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
    reward,
    balance: user.balance,
    energy: user.energy,
    freeTries: user.freeTries
  });
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
  user.energy += 20;
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

  user.energy += 20;
  user.balance += 100;
  user.adsWatchedToday++;
  user.lastAdAt = now;

  await user.save();

  res.json({
    energy: user.energy,
    balance: user.balance
  });
});

/* ================= START ================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log("🚀 Server running on port", PORT)
);

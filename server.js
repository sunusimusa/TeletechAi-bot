import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import User from "./models/User.js";

// ROUTES
import withdrawRoutes from "./routes/withdraw.routes.js";
import marketRoutes from "./routes/market.routes.js";

dotenv.config();

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/* ================= DATABASE ================= */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

/* ================= UTILS ================= */
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function regenEnergy(user) {
  const now = Date.now();
  const ENERGY_TIME = 5 * 60 * 1000;
  const ENERGY_GAIN = 5;
  const MAX_ENERGY = 100;

  if (!user.lastEnergy) user.lastEnergy = now;

  const diff = Math.floor((now - user.lastEnergy) / ENERGY_TIME);
  if (diff > 0) {
    user.energy = Math.min(MAX_ENERGY, user.energy + diff * ENERGY_GAIN);
    user.lastEnergy = now;
  }
}

/* ================= USER ================= */
app.post("/api/user", async (req, res) => {
  const { telegramId, ref } = req.body;
  if (!telegramId) return res.json({ error: "NO_TELEGRAM_ID" });

  let user = await User.findOne({ telegramId });

  if (!user) {
    user = await User.create({
      telegramId,
      referralCode: generateCode(),
      referredBy: ref || null
    });

    if (ref) {
      const refUser = await User.findOne({ referralCode: ref });
      if (refUser) {
        refUser.balance += 500;
        refUser.energy = Math.min(100, refUser.energy + 20);
        refUser.referralsCount += 1;
        await refUser.save();
      }
    }
  }

  if (!user.referralCode) {
    user.referralCode = generateCode();
    await user.save();
  }

  res.json({
    telegramId: user.telegramId,
    balance: user.balance,
    energy: user.energy,
    freeTries: user.freeTries,
    tokens: user.tokens,
    referralCode: user.referralCode,
    referralsCount: user.referralsCount
  });
});

/* ================= DAILY ================= */
app.post("/api/daily", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  regenEnergy(user);

  const now = Date.now();
  const DAY = 86400000;

  if (now - user.lastDaily < DAY)
    return res.json({ error: "COME_BACK_LATER" });

  user.dailyStreak =
    now - user.lastDaily < DAY * 2 ? user.dailyStreak + 1 : 1;

  const reward = user.dailyStreak * 100;
  user.lastDaily = now;
  user.balance += reward;
  user.energy = Math.min(100, user.energy + 10);

  await user.save();

  res.json({
    reward,
    streak: user.dailyStreak,
    balance: user.balance,
    energy: user.energy
  });
});

/* ================= OPEN BOX ================= */
app.post("/api/open", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  regenEnergy(user);

  if (user.freeTries > 0) user.freeTries--;
  else if (user.energy >= 10) user.energy -= 10;
  else return res.json({ error: "NO_ENERGY" });

  const reward = [0, 100, 200][Math.floor(Math.random() * 3)];
  user.balance += reward;

  await user.save();

  res.json({
    reward,
    balance: user.balance,
    energy: user.energy,
    freeTries: user.freeTries
  });
});

/* ================= CONVERT ================= */
app.post("/api/convert", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user) return res.json({ error: "USER_NOT_FOUND" });
  if (user.balance < 10000)
    return res.json({ error: "NOT_ENOUGH_POINTS" });

  user.balance -= 10000;
  user.tokens += 1;
  await user.save();

  res.json({
    balance: user.balance,
    tokens: user.tokens
  });
});

/* ================= BUY ENERGY ================= */
app.post("/api/buy-energy", async (req, res) => {
  const { telegramId, amount } = req.body;
  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const priceMap = { 100: 500, 500: 2000 };
  const cost = priceMap[amount];

  if (!cost) return res.json({ error: "INVALID_AMOUNT" });
  if (user.balance < cost)
    return res.json({ error: "NOT_ENOUGH_COINS" });

  user.balance -= cost;
  user.energy = Math.min(100, user.energy + amount);
  await user.save();

  res.json({
    balance: user.balance,
    energy: user.energy
  });
});

/* ================= TASK SYSTEM ================= */
app.post("/api/task/youtube", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user || user.joinedYoutube)
    return res.json({ error: "ALREADY_DONE" });

  user.joinedYoutube = true;
  user.tokens += 10;
  await user.save();

  res.json({ tokens: user.tokens });
});

app.post("/api/task/group", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user || user.joinedGroup)
    return res.json({ error: "ALREADY_DONE" });

  user.joinedGroup = true;
  user.tokens += 5;
  await user.save();

  res.json({ tokens: user.tokens });
});

app.post("/api/task/channel", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user || user.joinedChannel)
    return res.json({ error: "ALREADY_DONE" });

  user.joinedChannel = true;
  user.tokens += 5;
  await user.save();

  res.json({ tokens: user.tokens });
});

/* ================= ROUTES ================= */
app.use("/api/market", marketRoutes);
app.use("/api/withdraw", withdrawRoutes);

/* ================= START ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

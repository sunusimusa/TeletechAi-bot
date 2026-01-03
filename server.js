import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

// ================= UTILS =================
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function regenEnergy(user) {
  const now = Date.now();

  const ENERGY_TIME = 5 * 60 * 1000; // 5 minutes
  const ENERGY_GAIN = 5;
  const MAX_ENERGY = 100;

  const diff = Math.floor((now - user.lastEnergy) / ENERGY_TIME);

  if (diff > 0) {
    user.energy = Math.min(
      MAX_ENERGY,
      user.energy + diff * ENERGY_GAIN
    );

    user.lastEnergy = now;
  }
}

// ================= USER =================
app.post("/api/user", async (req, res) => {
  const { telegramId, ref } = req.body;
  if (!telegramId) return res.json({ error: "NO_USER" });

  let user = await User.findOne({ telegramId });

  if (!user) {
    user = await User.create({
      telegramId,
      referralCode: generateCode(),
      referredBy: ref || null,
      referralsCount: 0,
      balance: 0,
      energy: 100,
      freeTries: 3,
      tokens: 0,
      lastDaily: 0,
      lastEnergy: Date.now()
    });

    // reward referrer
    if (ref) {
      const refUser = await User.findOne({ referralCode: ref });
      if (refUser) {
        refUser.balance += 500;
        refUser.energy += 20;
        refUser.referralsCount += 1;
        await refUser.save();
      }
    }
  }

  regenEnergy(user);
  await user.save();

  res.json({
    telegramId: user.telegramId,
    balance: user.balance,
    energy: user.energy,
    freeTries: user.freeTries,
    tokens: user.tokens,
    referralsCount: user.referralsCount,
    referralCode: user.referralCode
  });
});

// ================= DAILY BONUS =================
app.post("/api/daily", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const now = Date.now();
  const DAY = 86400000;

  if (now - user.lastDaily < DAY)
    return res.json({ error: "COME_BACK_LATER" });

  if (now - user.lastDaily < DAY * 2) {
    user.dailyStreak += 1;
  } else {
    user.dailyStreak = 1;
  }

  const reward = 100 * user.dailyStreak;
  user.lastDaily = now;
  user.balance += reward;
  user.energy += 10;

regenEnergy(user);
  await user.save();

  res.json({
    reward,
    balance: user.balance,
    energy: user.energy,
    tokens: user.tokens,
    freeTries: user.freeTries,
    referralCode: user.referralCode,
    referralsCount: user.referralsCount
  });
});

// ================= OPEN BOX =================
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

// ================= CONVERT =================
app.post("/api/convert", async (req, res) => {
  try {
    const { telegramId } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: "TELEGRAM_ID_REQUIRED" });
    }

    const user = await User.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    if (user.balance < 10000) {
      return res.status(400).json({ error: "NOT_ENOUGH_POINTS" });
    }

    user.balance -= 10000;
    user.tokens = (user.tokens || 0) + 1;

    await user.save();

    return res.status(200).json({
      success: true,
      tokens: user.tokens,
      balance: user.balance
    });

  } catch (err) {
    console.error("Convert error:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// ================= BUY ENERGY =================
app.post("/api/buy-energy", async (req, res) => {
  const { telegramId, amount } = req.body;

  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  let cost = 0;

  if (amount === 100) cost = 500;
  else if (amount === 500) cost = 2000;
  else return res.json({ error: "INVALID_AMOUNT" });

  if (user.balance < cost)
    return res.json({ error: "NOT_ENOUGH_COINS" });

  user.balance -= cost;
  user.energy += amount;

  await user.save();

  res.json({
    energy: user.energy,
    balance: user.balance
  });
});

app.post("/api/task/youtube", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user) return res.json({ error: "USER_NOT_FOUND" });
  if (user.joinedYoutube) return res.json({ error: "ALREADY_DONE" });

  user.joinedYoutube = true;
  user.tokens += 10;

  await user.save();

  res.json({
    success: true,
    tokens: user.tokens
  });
});

app.post("/api/task/group", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user) return res.json({ error: "USER_NOT_FOUND" });
  if (user.joinedGroup) return res.json({ error: "ALREADY_DONE" });

  user.joinedGroup = true;
  user.tokens += 5;

  await user.save();

  res.json({
    success: true,
    tokens: user.tokens
  });
});

app.post("/api/task/channel", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user) return res.json({ error: "USER_NOT_FOUND" });
  if (user.joinedChannel) return res.json({ error: "ALREADY_DONE" });

  user.joinedChannel = true;
  user.tokens += 5;

  await user.save();

  res.json({
    success: true,
    tokens: user.tokens
  });
});

// ================= MARKET BUY TOKEN =================
app.post("/api/market/buy", async (req, res) => {
  const { telegramId, amount } = req.body; // amount = token count

  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const price = amount * 10000; // 1 token = 10k coins

  if (user.balance < price)
    return res.json({ error: "NOT_ENOUGH_COINS" });

  user.balance -= price;
  user.tokens += amount;

  await user.save();

  res.json({
    balance: user.balance,
    tokens: user.tokens
  });
});

// ================= MARKET SELL TOKEN =================
app.post("/api/market/sell", async (req, res) => {
  const { telegramId, amount } = req.body;

  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  if (user.tokens < amount)
    return res.json({ error: "NOT_ENOUGH_TOKENS" });

  const coins = amount * 10000;

  user.tokens -= amount;
  user.balance += coins;

  await user.save();

  res.json({
    balance: user.balance,
    tokens: user.tokens
  });
});

// ================= START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server running"));

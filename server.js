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

// ================= DB =================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

// ================= ENERGY FUNCTION =================
function regenEnergy(user) {
  const now = Date.now();
  const diff = Math.floor((now - user.lastEnergy) / 300000); // 5 min

  if (diff > 0) {
    user.energy = Math.min(100, user.energy + diff * 5);
    user.lastEnergy = now;
  }
}

// ================= CREATE / LOAD USER =================
app.post("/api/user", async (req, res) => {
  const { telegramId } = req.body;
  if (!telegramId) return res.json({ error: "NO_USER" });

  let user = await User.findOne({ telegramId });
  if (!user) user = await User.create({ telegramId });

  regenEnergy(user);
  await user.save();

  res.json(user);
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

  const rewards = [0, 100, 200];
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

// ================= CONVERT TOKEN =================
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
    tokens: user.tokens,
    balance: user.balance
  });
});

// ================= DAILY BONUS =================
app.post("/api/daily", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const now = Date.now();
  const ONE_DAY = 86400000;

  if (now - user.lastDaily < ONE_DAY)
    return res.json({ error: "COME_BACK_LATER" });

  user.lastDaily = now;
  user.balance += 500;
  user.energy += 20;

  await user.save();

  res.json({
    balance: user.balance,
    energy: user.energy
  });
});

// ================= START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

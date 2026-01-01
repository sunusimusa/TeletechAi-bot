import express from "express";
import User from "../models/User.js";

const router = express.Router();

// CREATE / LOAD USER
router.post("/user", async (req, res) => {
  const { telegramId } = req.body;

  let user = await User.findOne({ telegramId });
  if (!user) user = await User.create({ telegramId });

  res.json(user);
});

// OPEN BOX
router.post("/open", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user) return res.json({ error: "User not found" });

  if (user.freeTries > 0) user.freeTries--;
  else if (user.energy >= 10) user.energy -= 10;
  else return res.json({ error: "No energy" });

  const rewards = [
    { type: "coin", value: 100 },
    { type: "coin", value: 200 },
    { type: "nothing", value: 0 }
  ];

  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  if (reward.type === "coin") user.balance += reward.value;

  await user.save();

  res.json({
    reward,
    balance: user.balance,
    energy: user.energy,
    freeTries: user.freeTries
  });
});

// CONVERT
router.post("/convert", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (user.balance < 10000)
    return res.json({ error: "Not enough balance" });

  user.balance -= 10000;
  user.tokens += 1;
  await user.save();

  res.json({
    tokens: user.tokens,
    balance: user.balance
  });
});

// DAILY BONUS
router.post("/daily", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  const now = Date.now();
  if (now - user.lastDaily < 86400000)
    return res.json({ error: "Come back tomorrow" });

  user.lastDaily = now;
  user.balance += 500;
  user.energy += 20;

  await user.save();

  res.json({
    balance: user.balance,
    energy: user.energy
  });
});

export default router;

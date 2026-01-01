import express from "express";
import User from "../models/User.js";

const router = express.Router();

// OPEN BOX
router.post("/open", async (req, res) => {
  const { telegramId } = req.body;
  let user = await User.findOne({ telegramId });

  if (!user) {
    user = await User.create({ telegramId });
  }

  // Energy regen
  const now = Date.now();
  const diff = Math.floor((now - user.lastEnergy) / 300000);
  if (diff > 0) {
    user.energy = Math.min(100, user.energy + diff * 5);
    user.lastEnergy = now;
  }

  if (user.freeTries > 0) {
    user.freeTries--;
  } else if (user.energy >= 10) {
    user.energy -= 10;
  } else {
    return res.json({ error: "No energy" });
  }

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

export default router;

import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.post("/open", async (req, res) => {
  const { telegramId } = req.body;

  let user = await User.findOne({ telegramId });

  if (!user) {
    user = await User.create({ telegramId });
  }

  const now = Date.now();
  const diff = Math.floor((now - user.lastEnergy) / 300000); // 5 mins

  if (diff > 0) {
    user.energy = Math.min(100, user.energy + diff * 5);
    user.lastEnergy = now;
  }

  // ====== CHECK ENERGY ======
  if (user.freeTries > 0) {
    user.freeTries--;
  } else if (user.energy >= 10) {
    user.energy -= 10;
  } else {
    await user.save();
    return res.json({
      error: "No energy",
      energy: user.energy,
      balance: user.balance,
      freeTries: user.freeTries,
      tokens: user.tokens
    });
  }

  // ====== REWARD ======
  const rewards = [
    { type: "coin", value: 100 },
    { type: "coin", value: 200 },
    { type: "nothing", value: 0 }
  ];

  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  if (reward.type === "coin") {
    user.balance += reward.value;
  }

  await user.save();

  res.json({
    reward,
    balance: user.balance,
    energy: user.energy,
    freeTries: user.freeTries,
    tokens: user.tokens
  });
});

export default router;

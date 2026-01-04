import express from "express";
import User from "../models/User.js";

const router = express.Router();

// CLAIM ADS REWARD
router.post("/claim", async (req, res) => {
  const { telegramId } = req.body;
  if (!telegramId) return res.json({ error: "NO_TELEGRAM_ID" });

  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const now = Date.now();
  const COOLDOWN = 30 * 60 * 1000; // 30 minutes

  if (now - user.lastAdClaim < COOLDOWN) {
    const remain =
      Math.ceil((COOLDOWN - (now - user.lastAdClaim)) / 60000);
    return res.json({
      error: `WAIT_${remain}_MIN`
    });
  }

  // 🎁 REWARD
  const rewardEnergy = user.isPro ? 50 : 30;

  user.energy = Math.min(
    user.isPro ? 200 : 100,
    user.energy + rewardEnergy
  );

  user.lastAdClaim = now;
  await user.save();

  res.json({
    success: true,
    rewardEnergy,
    energy: user.energy
  });
});

const MAX_ENERGY = 100;

const ADS_RULES = {
  free: {
    reward: 20,
    cooldown: 30 * 60 * 1000, // 30 min
    dailyLimit: 5
  },
  pro1: {
    reward: 40,
    cooldown: 10 * 60 * 1000,
    dailyLimit: 15
  },
  pro2: {
    reward: 60,
    cooldown: 5 * 60 * 1000,
    dailyLimit: Infinity
  },
  pro3: {
    reward: 100,
    cooldown: 30 * 60 * 1000,
    dailyLimit: Infinity
  }
};

export default router;

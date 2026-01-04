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

export default router;

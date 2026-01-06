import express from "express";
import User from "../models/User.js";

const router = express.Router();

const MAX_ENERGY = 100;

// 🔧 CENTRAL CONFIG (SAI KA CANZA NAN KAWAI)
const ADS_RULES = {
  free: {
    reward: 20,
    cooldown: 5 * 60 * 1000, // ✅ 5 MIN (early stage)
    dailyLimit: 5
  },
  pro1: {
    reward: 40,
    cooldown: 3 * 60 * 1000,
    dailyLimit: 15
  },
  pro2: {
    reward: 60,
    cooldown: 2 * 60 * 1000,
    dailyLimit: Infinity
  },
  pro3: {
    reward: 100,
    cooldown: 1 * 60 * 1000,
    dailyLimit: Infinity
  }
};

// ================= CLAIM ADS =================
router.post("/claim", async (req, res) => {
  const { telegramId } = req.body;
  if (!telegramId)
    return res.json({ error: "NO_TELEGRAM_ID" });

  const user = await User.findOne({ telegramId });
  if (!user)
    return res.json({ error: "USER_NOT_FOUND" });

  const now = Date.now();

  // 🧠 USER TIER
  let tier = "free";
  if (user.isPro && user.proLevel === 1) tier = "pro1";
  if (user.isPro && user.proLevel === 2) tier = "pro2";
  if (user.isPro && user.proLevel >= 3) tier = "pro3";

  const rule = ADS_RULES[tier];

  // 📆 DAILY RESET
  const today = new Date().toISOString().slice(0, 10);
  if (user.lastAdDay !== today) {
    user.adsWatchedToday = 0;
    user.lastAdDay = today;
  }

  if (user.adsWatchedToday >= rule.dailyLimit) {
    return res.json({ error: "DAILY_LIMIT_REACHED" });
  }

  // ⏱️ COOLDOWN
  if (user.lastAdClaim && now - user.lastAdClaim < rule.cooldown) {
    const waitMin = Math.ceil(
      (rule.cooldown - (now - user.lastAdClaim)) / 60000
    );

    return res.json({
      error: "COOLDOWN_ACTIVE",
      waitMinutes: waitMin
    });
  }

  // 🎁 REWARD
  const rewardEnergy = rule.reward;
  user.energy = Math.min(MAX_ENERGY, user.energy + rewardEnergy);

  user.lastAdClaim = now;
  user.adsWatchedToday += 1;

  await user.save();

  res.json({
    success: true,
    tier,
    rewardEnergy,
    energy: user.energy,
    nextInMinutes: rule.cooldown / 60000
  });
});

export default router;

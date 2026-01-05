import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { PRO_PRICES, BURN_RATE } from "../config.js";

const router = express.Router();

router.post("/upgrade", async (req, res) => {
  const { telegramId, level } = req.body;

  if (!telegramId || !PRO_PRICES[level])
    return res.json({ error: "INVALID_DATA" });

  const user = await User.findOne({ telegramId });
  const system = await User.findOne({ telegramId: "SYSTEM" });

  if (!user || !system)
    return res.json({ error: "USER_NOT_FOUND" });

  // ⛔ kada a rage PRO level
  if (user.proLevel >= level)
    return res.json({ error: "ALREADY_THIS_LEVEL_OR_HIGHER" });

  const price = PRO_PRICES[level];

  if (user.tokens < price)
    return res.json({ error: "NOT_ENOUGH_TOKENS" });

  // 🔥 burn calculation
  const burnAmount = Math.floor(price * BURN_RATE);
  const systemAmount = price - burnAmount;

  // 💸 apply balances
  user.tokens -= price;
  user.isPro = true;
  user.proLevel = level;

  system.tokens += systemAmount;

  await user.save();
  await system.save();

  // 📜 TRANSACTION LOGS
  await Transaction.create({
    fromWallet: user.walletAddress,
    toWallet: "SYSTEM",
    amount: price,
    gasFee: burnAmount,
    type: "PRO_UPGRADE"
  });

  await Transaction.create({
    fromWallet: "SYSTEM",
    toWallet: "BURN",
    amount: burnAmount,
    type: "BURN"
  });

  res.json({
    success: true,
    proLevel: level,
    paid: price,
    burned: burnAmount,
    systemReceived: systemAmount,
    tokensLeft: user.tokens
  });
});

export default router;

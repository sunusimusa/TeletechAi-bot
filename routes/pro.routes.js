import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { burnToken } from "../services/burn.service.js";
import { SYSTEM_WALLET } from "../config/constants.js";

const router = express.Router();

const PRO_PRICE = {
  1: 5,
  2: 10,
  3: 20
};

router.post("/upgrade", async (req, res) => {
  const { telegramId, level } = req.body;

  const user = await User.findOne({ telegramId });
  const system = await User.findOne({ telegramId: "SYSTEM" });

  if (!user || !system)
    return res.json({ error: "USER_NOT_FOUND" });

  const price = PRO_PRICE[level];
  if (!price) return res.json({ error: "INVALID_LEVEL" });

  if (user.tokens < price)
    return res.json({ error: "NOT_ENOUGH_TOKENS" });

  const burnAmount = Math.floor(price * 0.2);
  const systemGain = price - burnAmount;

  user.tokens -= price;
  user.isPro = true;
  user.proLevel = level;

  system.tokens += systemGain;

  await user.save();
  await system.save();

  await burnToken(burnAmount, "PRO_UPGRADE");

  await Transaction.create({
    fromWallet: user.walletAddress,
    toWallet: SYSTEM_WALLET,
    amount: systemGain,
    gasFee: burnAmount,
    type: "PRO_UPGRADE"
  });

  res.json({
    success: true,
    proLevel: level,
    burned: burnAmount,
    tokens: user.tokens
  });
});

export default router;

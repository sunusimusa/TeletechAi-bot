import express from "express";
import User from "../models/User.js";

const router = express.Router();

const GAS_FEE = 1; // 1 token

router.post("/", async (req, res) => {
  const { telegramId, toWallet, amount } = req.body;

  if (!telegramId || !toWallet || !amount)
    return res.json({ error: "MISSING_FIELDS" });

  if (amount <= 0)
    return res.json({ error: "INVALID_AMOUNT" });

  const sender = await User.findOne({ telegramId });
  const receiver = await User.findOne({ walletAddress: toWallet });
  const system = await User.findOne({ telegramId: "SYSTEM" });

  if (!sender) return res.json({ error: "SENDER_NOT_FOUND" });
  if (!receiver) return res.json({ error: "RECEIVER_NOT_FOUND" });

  const totalCost = amount + GAS_FEE;

  if (sender.tokens < totalCost)
    return res.json({ error: "NOT_ENOUGH_TOKENS" });

  // ===== FREE LIMIT =====
  const today = new Date().toISOString().slice(0, 10);
  if (sender.lastSentDay !== today) {
    sender.sentToday = 0;
    sender.lastSentDay = today;
  }

  if (!sender.isPro && sender.sentToday >= 5) {
    return res.json({ error: "DAILY_LIMIT_REACHED" });
  }

  // ===== TRANSFER =====
  sender.tokens -= totalCost;
  receiver.tokens += amount;
  system.tokens += GAS_FEE;

  sender.sentToday += 1;

  await sender.save();
  await receiver.save();
  await system.save();

  res.json({
    success: true,
    sent: amount,
    gas: GAS_FEE,
    balance: sender.tokens
  });
});

export default router;

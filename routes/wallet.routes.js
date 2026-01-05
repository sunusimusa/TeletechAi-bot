import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.post("/send", async (req, res) => {
  const { telegramId, toWallet, amount } = req.body;

  if (!telegramId || !toWallet || amount <= 0)
    return res.json({ error: "INVALID_DATA" });

  const sender = await User.findOne({ telegramId });
  const receiver = await User.findOne({ walletAddress: toWallet });
  const system = await User.findOne({ telegramId: "SYSTEM" });

  if (!sender) return res.json({ error: "SENDER_NOT_FOUND" });
  if (!receiver) return res.json({ error: "RECEIVER_NOT_FOUND" });
  if (!system) return res.json({ error: "SYSTEM_WALLET_MISSING" });

  const gasFee = getGasFee(sender);
  const totalCost = amount + gasFee;

  if (sender.tokens < totalCost)
    return res.json({ error: "INSUFFICIENT_BALANCE" });

  // ⛔ FREE LIMIT
  if (!sender.isPro && sender.sentToday >= 5)
    return res.json({ error: "DAILY_LIMIT_REACHED" });

  // ✅ TRANSFER
  sender.tokens -= totalCost;
  receiver.tokens += amount;
  system.tokens += gasFee;

  sender.sentToday = (sender.sentToday || 0) + 1;

  await sender.save();
  await receiver.save();
  await system.save();

  // 🧾 TRANSACTIONS
  await Transaction.create({
    from: sender.walletAddress,
    to: receiver.walletAddress,
    amount,
    gasFee,
    type: "SEND"
  });

  await Transaction.create({
    from: sender.walletAddress,
    to: receiver.walletAddress,
    amount,
    gasFee,
    type: "RECEIVE"
  });

  res.json({
    success: true,
    sent: amount,
    gasFee,
    remainingTokens: sender.tokens
  });
});

import Transaction from "../models/Transaction.js";

router.post("/history", async (req, res) => {
  const { telegramId } = req.body;

  if (!telegramId)
    return res.json({ error: "NO_TELEGRAM_ID" });

  const user = await User.findOne({ telegramId });
  if (!user)
    return res.json({ error: "USER_NOT_FOUND" });

  const wallet = user.walletAddress;

  const history = await Transaction.find({
    $or: [
      { from: wallet },
      { to: wallet }
    ]
  }).sort({ createdAt: -1 }).limit(50);

  res.json({
    wallet,
    history
  });
});

export default router;

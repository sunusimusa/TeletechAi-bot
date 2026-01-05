import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { burnToken } from "../services/burn.service.js";

const router = express.Router();

/* ================= SEND TOKEN ================= */
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

  // ⛽ GAS RULE
  const gasFee = sender.isPro ? 1 : 2;
  const totalCost = amount + gasFee;

  if (sender.tokens < totalCost)
    return res.json({ error: "INSUFFICIENT_BALANCE" });

  // ⛔ FREE DAILY LIMIT
  sender.sentToday = sender.sentToday || 0;
  if (!sender.isPro && sender.sentToday >= 5)
    return res.json({ error: "DAILY_LIMIT_REACHED" });

  // 🔥 BURN SPLIT
  const burnGas = Math.floor(gasFee / 2);
  const systemGas = gasFee - burnGas;

  // 💸 TRANSFER
  sender.tokens -= totalCost;
  receiver.tokens += amount;
  system.tokens += systemGas;
  sender.sentToday += 1;

  await sender.save();
  await receiver.save();
  await system.save();

  // 🔥 BURN
  if (burnGas > 0) {
    await burnToken(burnGas, "SEND_GAS");
  }

  // 🧾 TRANSACTION LOG
  await Transaction.create({
    fromWallet: sender.walletAddress,
    toWallet: receiver.walletAddress,
    amount,
    gasFee,
    type: "SEND"
  });

  res.json({
    success: true,
    sent: amount,
    gasFee,
    burned: burnGas,
    remainingTokens: sender.tokens
  });
});

/* ================= TRANSACTION HISTORY ================= */
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
      { fromWallet: wallet },
      { toWallet: wallet }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    wallet,
    history
  });
});

export default router;

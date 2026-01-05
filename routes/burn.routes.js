import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

/**
 * 🔥 BURN TOKENS
 * Only SYSTEM wallet can burn
 * Used for: gas burn, pro upgrade burn, manual burn
 */
router.post("/", async (req, res) => {
  const { amount, reason } = req.body;

  if (!amount || amount <= 0) {
    return res.json({ error: "INVALID_AMOUNT" });
  }

  const system = await User.findOne({ telegramId: "SYSTEM" });
  if (!system) {
    return res.json({ error: "SYSTEM_WALLET_NOT_FOUND" });
  }

  if (system.tokens < amount) {
    return res.json({ error: "SYSTEM_NOT_ENOUGH_TOKENS" });
  }

  // 🔥 BURN
  system.tokens -= amount;
  await system.save();

  // 🧾 LOG TRANSACTION
  await Transaction.create({
    fromWallet: "TTECH-SYSTEM",
    toWallet: "BURN",
    amount,
    gasFee: 0,
    type: "BURN",
    reason: reason || "MANUAL_BURN"
  });

  res.json({
    success: true,
    burned: amount,
    systemBalance: system.tokens
  });
});

export default router;

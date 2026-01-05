import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

/**
 * 🔥 Burn token from SYSTEM wallet
 */
export async function burnFromSystem(amount, reason = "AUTO_BURN") {
  if (!amount || amount <= 0) return;

  const system = await User.findOne({ telegramId: "SYSTEM" });
  if (!system) return;

  if (system.tokens < amount) return;

  // 🔥 burn
  system.tokens -= amount;
  await system.save();

  // 🧾 log
  await Transaction.create({
    fromWallet: "TTECH-SYSTEM",
    toWallet: "BURN",
    amount,
    gasFee: 0,
    type: "BURN",
    reason
  });
    }

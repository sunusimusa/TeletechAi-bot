import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

/**
 * 🔥 Burn tokens from SYSTEM wallet
 */
export async function burnToken(amount, reason = "AUTO_BURN") {
  if (!amount || amount <= 0) return;

  const system = await User.findOne({ telegramId: "SYSTEM" });
  if (!system) throw new Error("SYSTEM_WALLET_NOT_FOUND");

  if (system.tokens < amount) {
    throw new Error("SYSTEM_INSUFFICIENT_TOKENS");
  }

  system.tokens -= amount;
  await system.save();

  await Transaction.create({
    fromWallet: "TTECH-SYSTEM",
    toWallet: "BURN",
    amount,
    gasFee: 0,
    type: "BURN",
    reason
  });

  return true;
}

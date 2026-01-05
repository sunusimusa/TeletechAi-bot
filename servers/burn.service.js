// services/burn.service.js
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

/**
 * Burn tokens permanently
 * @param {number} amount - amount to burn
 * @param {string} reason - reason of burn
 */
export async function burnToken(amount, reason = "BURN") {
  if (!amount || amount <= 0) return;

  // 🔥 SYSTEM wallet
  const system = await User.findOne({ telegramId: "SYSTEM" });
  if (!system) {
    throw new Error("SYSTEM_WALLET_MISSING");
  }

  // SYSTEM must have tokens to burn
  if (system.tokens < amount) {
    throw new Error("INSUFFICIENT_SYSTEM_TOKENS");
  }

  // 🔥 Burn = remove from circulation
  system.tokens -= amount;
  await system.save();

  // 🧾 Log burn transaction
  await Transaction.create({
    fromWallet: system.walletAddress,
    toWallet: "BURN",
    amount,
    gasFee: 0,
    type: "BURN"
  });

  console.log(`🔥 Burned ${amount} tokens | Reason: ${reason}`);
}

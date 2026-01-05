import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

// 🔥 Burn tokens from SYSTEM wallet
export async function burnToken(amount, reason = "BURN") {
  if (amount <= 0) return;

  const system = await User.findOne({ telegramId: "SYSTEM" });
  if (!system) throw new Error("SYSTEM_WALLET_MISSING");

  if (system.tokens < amount) {
    throw new Error("INSUFFICIENT_SYSTEM_TOKENS");
  }

  // 🔥 Reduce supply
  system.tokens -= amount;
  await system.save();

  // 🧾 Log burn
  await Transaction.create({
    fromWallet: system.walletAddress,
    toWallet: "BURN",
    amount,
    gasFee: 0,
    type: reason // "SEND_GAS" | "PRO_UPGRADE" | "BURN"
  });

  return true;
    }

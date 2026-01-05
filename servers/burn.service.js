import Transaction from "../models/Transaction.js";
import { BURN_WALLET } from "../config/constants.js";

export async function burnToken(amount, reason = "BURN") {
  if (amount <= 0) return;

  await Transaction.create({
    fromWallet: "SYSTEM",
    toWallet: BURN_WALLET,
    amount,
    gasFee: 0,
    type: reason
  });
}

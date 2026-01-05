import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { REF_SEASON, REF_REWARDS } from "../config/season.js";

export async function runReferralPayout() {
  const now = new Date();

  // ❌ idan season bai kare ba ko an riga an biya
  if (now < REF_SEASON.end || REF_SEASON.paid) return;

  console.log("🏆 Running referral payout...");

  const topUsers = await User.find()
    .sort({ referralsCount: -1 })
    .limit(10);

  if (topUsers.length === 0) return;

  for (let i = 0; i < topUsers.length; i++) {
    const user = topUsers[i];

    let reward = 0;
    if (i === 0) reward = REF_REWARDS[1];
    else if (i === 1) reward = REF_REWARDS[2];
    else if (i === 2) reward = REF_REWARDS[3];
    else reward = REF_REWARDS.rest;

    user.tokens += reward;
    await user.save();

    await Transaction.create({
      fromWallet: "SYSTEM",
      toWallet: user.walletAddress,
      amount: reward,
      type: "REF_REWARD"
    });
  }

  // 🔒 lock season
  REF_SEASON.paid = true;
  console.log("✅ Referral rewards distributed");
}

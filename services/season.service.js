import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { REF_SEASON } from "../config/season.js";

export async function checkReferralSeason() {
  const now = new Date();

  if (now < REF_SEASON.end) return; // still active

  console.log("⏳ Referral season ended. Processing rewards...");

  // 🏆 TOP 3
  const top = await User.find()
    .sort({ seasonReferrals: -1 })
    .limit(3);

  for (let i = 0; i < top.length; i++) {
    const reward = REF_SEASON.rewards[i + 1];
    if (!reward) continue;

    top[i].tokens += reward;
    await top[i].save();

    await Transaction.create({
      fromWallet: "SYSTEM",
      toWallet: top[i].walletAddress,
      amount: reward,
      type: "REF_REWARD"
    });
  }

  // 🔄 RESET SEASON REFERRALS
  await User.updateMany(
    {},
    { $set: { seasonReferrals: 0 } }
  );

  console.log("✅ Season rewards paid & referrals reset");

  // ⚠️ (OPTIONAL)
  // update season dates here or via admin
}

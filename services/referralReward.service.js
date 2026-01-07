import User from "../models/User.js";
import { REF_SEASON, REF_REWARDS } from "../config/season.js";

export async function payReferralWinners() {
  // 🛑 Kada a biya sau biyu
  if (REF_SEASON.paid) {
    console.log("ℹ️ Referral rewards already paid");
    return;
  }

  const now = new Date();

  // ⏳ Season bai kare ba
  if (now < REF_SEASON.end) return;

  console.log("🏆 Paying referral rewards...");

  const topUsers = await User.find({
    telegramId: { $ne: "SYSTEM" },
    seasonReferrals: { $gt: 0 }
  })
    .sort({ seasonReferrals: -1 })
    .limit(10);

  for (let i = 0; i < topUsers.length; i++) {
    const user = topUsers[i];
    const rank = i + 1;

    let reward =
      REF_REWARDS[rank] ?? REF_REWARDS.rest;

    user.balance += reward;
    await user.save();

    console.log(
      `✅ Rank #${rank} → ${user.telegramId} +${reward}`
    );
  }

  // 🔒 Kulle season
  REF_SEASON.paid = true;

  console.log("✅ Referral rewards completed");
}

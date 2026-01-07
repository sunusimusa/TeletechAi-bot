import { REF_SEASON } from "../config/season.js";
import { payReferralWinners } from "./referralReward.service.js";

export async function checkReferralSeason() {
  const now = new Date();

  // ❌ season bai kare ba
  if (now < REF_SEASON.end) return;

  // ❌ already paid
  if (REF_SEASON.paid) return;

  console.log("🏁 Referral season ended → paying rewards");

  // ✅ PAYOUT
  await payReferralWinners();

  // 🔒 lock season
  REF_SEASON.paid = true;

  console.log("✅ Referral payout completed");
}

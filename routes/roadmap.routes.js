import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json([
    {
      phase: "Phase 1",
      title: "Core Game",
      status: "completed",
      items: [
        "Lucky Box Game",
        "Energy System",
        "Daily Bonus",
        "Referral System",
        "Cloud Save"
      ]
    },
    {
      phase: "Phase 2",
      title: "Growth & PRO",
      status: "active",
      items: [
        "PRO Level 1 – 3",
        "Better Rewards",
        "Task System",
        "Token Convert",
        "Ads Monetization"
      ]
    },
    {
      phase: "Phase 3",
      title: "Blockchain",
      status: "upcoming",
      items: [
        "TON Withdraw",
        "Jetton Market",
        "Liquidity Pool",
        "On-chain Transparency"
      ]
    }
  ]);
});

export default router;

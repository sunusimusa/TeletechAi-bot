import express from "express";
import { runReferralPayout } from "../services/refPayout.service.js";

const router = express.Router();

router.post("/ref/payout", async (req, res) => {
  await runReferralPayout();
  res.json({ success: true });
});

export default router;

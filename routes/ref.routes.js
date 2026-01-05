import express from "express";
import User from "../models/User.js";
import { REF_SEASON } from "../config/season.js";

const router = express.Router();

router.get("/leaderboard", async (req, res) => {
  try {
    const top = await User.find()
      .sort({ seasonReferrals: -1 })
      .limit(10)
      .select("telegramId seasonReferrals");

    res.json({
      season: REF_SEASON.name,
      start: REF_SEASON.start,
      end: REF_SEASON.end,
      top
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "FAILED_TO_LOAD_LEADERBOARD" });
  }
});

export default router; // ✅ MUHIMMI

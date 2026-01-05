// routes/stats.routes.js
import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

const TOTAL_SUPPLY = 1_000_000_000;

router.get("/supply", async (req, res) => {
  const burnedAgg = await Transaction.aggregate([
    { $match: { type: "BURN" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const burned = burnedAgg[0]?.total || 0;

  const system = await User.findOne({ telegramId: "SYSTEM" });
  const systemBalance = system?.tokens || 0;

  const circulating =
    TOTAL_SUPPLY - burned - systemBalance;

  res.json({
    totalSupply: TOTAL_SUPPLY,
    burned,
    systemBalance,
    circulating
  });
});

router.get("/burns", async (req, res) => {
  const burns = await Transaction.find({ type: "BURN" })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    burns
  });
});

export default router;

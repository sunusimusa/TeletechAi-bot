import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

const TOTAL_SUPPLY = 1_000_000_000;

router.get("/supply", async (req, res) => {
  // 🔥 total burned
  const burnedAgg = await Transaction.aggregate([
    { $match: { type: "BURN" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const burned = burnedAgg[0]?.total || 0;

  // 🏦 system wallet
  const system = await User.findOne({ telegramId: "SYSTEM" });
  const systemBalance = system?.tokens || 0;

  // 🟢 circulating
  const circulating =
    TOTAL_SUPPLY - burned - systemBalance;

  res.json({
    totalSupply: TOTAL_SUPPLY,
    burned,
    systemBalance,
    circulating
  });
});

export default router;

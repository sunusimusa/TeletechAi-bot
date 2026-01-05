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

async function loadSupply() {
  const res = await fetch("/api/stats/supply");
  const data = await res.json();

  document.getElementById("totalSupply").innerText =
    data.totalSupply.toLocaleString();

  document.getElementById("burned").innerText =
    data.burned.toLocaleString();

  document.getElementById("systemBal").innerText =
    data.systemBalance.toLocaleString();

  document.getElementById("circulating").innerText =
    data.circulating.toLocaleString();
}

loadSupply();

export default router;

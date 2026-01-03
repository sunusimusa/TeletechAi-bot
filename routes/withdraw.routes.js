import express from "express";
import User from "../models/User.js";
import { sendTON, sendJetton } from "../services/ton.service.js";

const router = express.Router();

// ===== TON WITHDRAW =====
router.post("/ton", async (req, res) => {
  const { telegramId, address, amount } = req.body;

  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });
  if (user.tokens < amount)
    return res.json({ error: "NOT_ENOUGH_TOKENS" });

  try {
    await sendTON(address, amount * 0.1); // example rate

    user.tokens -= amount;
    await user.save();

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.json({ error: "TON_FAILED" });
  }
});

// ===== JETTON WITHDRAW =====
router.post("/jetton", async (req, res) => {
  const { telegramId, address, amount } = req.body;

  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });
  if (user.tokens < amount)
    return res.json({ error: "NOT_ENOUGH_TOKENS" });

  try {
    await sendJetton({
      jettonMaster: process.env.JETTON_MASTER,
      toAddress: address,
      amount
    });

    user.tokens -= amount;
    await user.save();

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.json({ error: "JETTON_FAILED" });
  }
});

export default router;

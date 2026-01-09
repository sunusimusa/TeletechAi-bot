import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import User from "./models/User.js";
import { startBot } from "./bot.js";

dotenv.config();
const app = express();

/* ================= PATH (ESM FIX) ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⚠️ MUHIMMI: serve Mini App
app.use(express.static(path.join(__dirname, "public")));

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

/* ================= HELPERS ================= */
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function generateWalletUnique() {
  let wallet, exists = true;
  while (exists) {
    wallet = "TTECH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    exists = await User.findOne({ walletAddress: wallet });
  }
  return wallet;
}

/* ================= API ================= */

// CREATE / LOAD USER
app.post("/api/user", async (req, res) => {
  try {
    const { telegramId, ref } = req.body;

    if (!telegramId) {
      return res.json({ error: "INVALID_TELEGRAM_ID" });
    }

    let user = await User.findOne({ telegramId });

    if (!user) {
      user = await User.create({
        telegramId,
        walletAddress: await generateWalletUnique(),
        referralCode: generateCode(),
        referredBy: ref || null,
        balance: 0,
        energy: 50,
        tokens: 0,
        freeTries: 3
      });
    }

    res.json({
      telegramId: user.telegramId,
      walletAddress: user.walletAddress,
      balance: user.balance,
      energy: user.energy,
      tokens: user.tokens,
      freeTries: user.freeTries,
      referralCode: user.referralCode
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= MINI APP ENTRY ================= */
/**
 * ⚠️ WANNAN NE MAFITA
 * Duk abin da ba /api bane → index.html
 */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================= START SERVER =================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  startBot(); // 👈 WANNAN NE MUHIMMI
});

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const FOUNDER_TELEGRAM_ID = "1248500925"; // 🔁 saka naka

async function lockFounder() {
  await mongoose.connect(process.env.MONGODB_URI);

  const result = await User.updateMany(
    { telegramId: { $ne: FOUNDER_TELEGRAM_ID } },
    { $set: { proLevel: 3, isPro: true } }
  );

  console.log("✅ Founder locked");
  console.log("Modified users:", result.modifiedCount);

  await mongoose.disconnect();
}

lockFounder().catch(console.error);

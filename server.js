import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import gameRoutes from "./routes/game.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log(err));

app.use("/api", gameRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

/* ================== USER MODEL ================== */
const UserSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },
  balance: { type: Number, default: 0 },
  energy: { type: Number, default: 100 },
  freeTries: { type: Number, default: 3 },
  tokens: { type: Number, default: 0 }
});

const User = mongoose.model("User", UserSchema);

/* ================== API ================== */

// Get or create user
app.post("/api/user", async (req, res) => {
  const { telegramId } = req.body;

  let user = await User.findOne({ telegramId });
  if (!user) {
    user = await User.create({ telegramId });
  }

  res.json(user);
});

// Open box
app.post("/api/open", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user) return res.json({ error: "User not found" });

  if (user.freeTries > 0) {
    user.freeTries--;
  } else if (user.energy >= 10) {
    user.energy -= 10;
  } else {
    return res.json({ error: "NO_ENERGY" });
  }

  const rewards = [0, 100, 200];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  user.balance += reward;
  await user.save();

  res.json({
    reward,
    balance: user.balance,
    energy: user.energy,
    freeTries: user.freeTries
  });
});

// Convert to token
app.post("/api/convert", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (user.balance < 10000) {
    return res.json({ error: "NOT_ENOUGH_POINTS" });
  }

  user.balance -= 10000;
  user.tokens += 1;
  await user.save();

  res.json({
    tokens: user.tokens,
    balance: user.balance
  });
});

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});

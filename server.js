require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ================= CONFIG =================
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL = process.env.CHANNEL_USERNAME;

const ENERGY_MAX = 100;
const ENERGY_REGEN_TIME = 5000;
const REF_BONUS = 20;

// ================= DB =================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

const userSchema = new mongoose.Schema({
  telegramId: String,
  balance: { type: Number, default: 0 },
  energy: { type: Number, default: ENERGY_MAX },
  level: { type: Number, default: 1 },
  referrals: { type: Number, default: 0 },
  refBy: { type: String, default: null },
  lastEnergyUpdate: { type: Number, default: Date.now },
  lastDaily: { type: Number, default: 0 },
});

const User = mongoose.model("User", userSchema);

// ================= UTILS =================
function regenEnergy(user) {
  const now = Date.now();
  const diff = Math.floor((now - user.lastEnergyUpdate) / ENERGY_REGEN_TIME);
  if (diff > 0) {
    user.energy = Math.min(ENERGY_MAX, user.energy + diff);
    user.lastEnergyUpdate = now;
  }
}

async function isMember(userId) {
  try {
    const res = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`,
      { params: { chat_id: CHANNEL, user_id: userId } }
    );
    return ["member", "administrator", "creator"].includes(res.data.result.status);
  } catch {
    return false;
  }
}

// ================= USER INIT =================
app.post("/user", async (req, res) => {
  const init = req.body.initData;
  const userId = init?.user?.id;
  const ref = init?.start_param;

  if (!userId) return res.json({ error: "INVALID_USER" });

  const joined = await isMember(userId);
  if (!joined) return res.json({ error: "JOIN_REQUIRED" });

  let user = await User.findOne({ telegramId: userId });

  if (!user) {
    user = new User({ telegramId: userId });

    if (ref && ref !== userId) {
      const refUser = await User.findOne({ telegramId: ref });
      if (refUser) {
        refUser.balance += REF_BONUS;
        refUser.referrals += 1;
        await refUser.save();
        user.refBy = ref;
      }
    }

    await user.save();
  }

  regenEnergy(user);
  await user.save();

  res.json(user);
});

// ================= TAP =================
app.post("/tap", async (req, res) => {
  const user = await User.findOne({ telegramId: req.body.userId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  regenEnergy(user);
  if (user.energy <= 0) return res.json({ error: "NO_ENERGY" });

  user.energy--;
  user.balance++;
  user.level = Math.floor(user.balance / 100) + 1;
  await user.save();

  res.json(user);
});

// ================= LEADERBOARD =================
app.get("/leaderboard", async (req, res) => {
  const users = await User.find().sort({ balance: -1 }).limit(10);
  res.json(users);
});

app.get("/top-referrals", async (req, res) => {
  const users = await User.find().sort({ referrals: -1 }).limit(10);
  res.json(users);
});

// ================= START =================
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

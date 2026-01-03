import express from "express";
import User from "../models/User.js";

const router = express.Router();

// ================= CREATE / LOAD USER =================
router.post("/user", async (req, res) => {
  const { telegramId } = req.body;

  if (!telegramId) return res.json({ error: "NO_USER" });

  let user = await User.findOne({ telegramId });

  if (!user) {
    user = await User.create({
      telegramId,
      balance: 0,
      energy: 100,
      freeTries: 3,
      tokens: 0,
      lastDaily: 0,
      lastEnergy: Date.now()
    });
  }

  res.json(user);
});

// ================= ENERGY REGEN =================
function regenEnergy(user) {
  const now = Date.now();
  const diff = Math.floor((now - user.lastEnergy) / 300000); // 5 min

  if (diff > 0) {
    user.energy = Math.min(100, user.energy + diff * 5);
    user.lastEnergy = now;
  }
}

// ================= OPEN BOX =================
router.post("/open", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  regenEnergy(user);

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

// ================= CONVERT =================
router.post("/convert", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  if (user.balance < 10000)
    return res.json({ error: "NOT_ENOUGH_POINTS" });

  user.balance -= 10000;
  user.tokens += 1;

  await user.save();

  res.json({
    tokens: user.tokens,
    balance: user.balance
  });
});

// ================= DAILY BONUS =================
router.post("/daily", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  if (now - user.lastDaily < ONE_DAY)
    return res.json({ error: "COME_BACK_LATER" });

  user.lastDaily = now;
  user.balance += 500;
  user.energy += 20;

  await user.save();

  res.json({
    balance: user.balance,
    energy: user.energy
  });
});

async function withdrawTokens() {
  const address = document.getElementById("wallet").value;
  const amount = Number(document.getElementById("amount").value);

  if (!address || !amount) {
    alert("Fill wallet & amount");
    return;
  }

  const res = await fetch("/api/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: TELEGRAM_ID,
      address,
      amount
    })
  });

  const data = await res.json();

  if (data.error) {
    alert("❌ " + data.error);
    return;
  }

  alert("✅ Withdraw sent!");
  tokens -= amount;
  updateUI();
}

async function withdrawJetton() {
  const address = document.getElementById("wallet").value;
  const amount = Number(document.getElementById("amount").value);

  if (!address || !amount) {
    alert("Fill wallet & amount");
    return;
  }

  const res = await fetch("/api/withdraw/jetton", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: TELEGRAM_ID,
      address,
      amount
    })
  });

  const data = await res.json();

  if (data.error) {
    alert("❌ " + data.error);
    return;
  }

  alert("✅ Jetton withdraw sent!");
  tokens -= amount;
  updateUI();
}

async function buyToken(amount) {
  const res = await fetch("/api/market/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID, amount })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  balance = data.balance;
  tokens = data.tokens;
  updateUI();
}

async function sellToken(amount) {
  const res = await fetch("/api/market/sell", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID, amount })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  balance = data.balance;
  tokens = data.tokens;
  updateUI();
}

export default router;

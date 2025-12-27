const express = require("express");
const fs = require("fs");
const path = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const REF_REWARD = 10;
const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ================= CONFIG =================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const DB_FILE = "./users.json";
const MAX_ENERGY = 100;
const ENERGY_REGEN = 30000;

// ================= LOAD USERS =================
let users = fs.existsSync(DB_FILE)
  ? JSON.parse(fs.readFileSync(DB_FILE))
  : {};

function saveUsers() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// ================= USER INIT =================
app.post("/user", (req, res) => {
  const { initData } = req.body;

  if (!initData || !initData.user) {
    return res.json({ error: "User not found" });
  }

  const user = initData.user;
  const userId = user.id.toString();

  if (!users[userId]) {
    users[userId] = {
      balance: 0,
      energy: 100,
      lastEnergy: Date.now(),
      lastDaily: 0,
      wallet: "",
      refs: [],
      withdraws: []
    };
  }

  res.json({
    id: userId,
    balance: users[userId].balance,
    energy: users[userId].energy
  });
});

// ================= TAP =================
app.post("/tap", (req, res) => {
  const { userId } = req.body;
  if (!users[userId]) return res.json({ error: "User not found" });

  if (users[userId].energy <= 0)
    return res.json({ error: "No energy" });

  users[userId].energy -= 1;
  users[userId].balance += 1;

  saveUsers();
  res.json({
    balance: users[userId].balance,
    energy: users[userId].energy
  });
});

// ================= DAILY =================
app.post("/daily", (req, res) => {
  const { userId } = req.body;
  const DAY = 86400000;

  if (!users[userId]) return res.json({ error: "User not found" });

  if (Date.now() - users[userId].lastDaily < DAY)
    return res.json({ error: "Already claimed" });

  users[userId].lastDaily = Date.now();
  users[userId].balance += 20;

  saveUsers();
  res.json({ reward: 20, balance: users[userId].balance });
});

// ================= TASK =================
app.post("/task", (req, res) => {
  const { userId, type } = req.body;

  if (!users[userId]) return res.json({ error: "User not found" });
  if (users[userId].tasks[type]) return res.json({ error: "Done" });

  users[userId].tasks[type] = true;
  users[userId].balance += 5;

  saveUsers();
  res.json({ success: true, balance: users[userId].balance });
});

// ================= WALLET =================
app.post("/wallet", (req, res) => {
  const { userId, address } = req.body;
  if (!users[userId]) return res.json({ error: "User not found" });

  users[userId].wallet = address;
  saveUsers();

  res.json({ success: true });
});

// ================= WITHDRAW =================
app.post("/withdraw", (req, res) => {
  const { userId, amount } = req.body;

  if (!users[userId]) return res.json({ error: "User not found" });
  if (amount < 100) return res.json({ error: "Minimum 100" });
  if (users[userId].balance < amount)
    return res.json({ error: "Not enough balance" });

  users[userId].balance -= amount;
  users[userId].withdraws.push({
    amount,
    status: "pending",
    time: Date.now()
  });

  saveUsers();
  res.json({ success: true });
});

// ================= LEADERBOARD =================
app.get("/leaderboard", (req, res) => {
  const list = Object.entries(users)
    .map(([id, u]) => ({ id, balance: u.balance }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10);

  res.json(list);
});

// ================= AUTO PAY REFERRALS =================
setInterval(() => {
  const top = Object.entries(users)
    .map(([id, u]) => ({ id, refs: u.refs?.length || 0 }))
    .sort((a, b) => b.refs - a.refs)
    .slice(0, 3);

  const rewards = [10, 5, 3];

  top.forEach((u, i) => {
    users[u.id].balance += rewards[i] || 0;
  });

  saveUsers();
}, 24 * 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

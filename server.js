const express = require("express");
const fs = require("fs");
const path = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

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
let users = {};
if (fs.existsSync(DB_FILE)) {
  users = JSON.parse(fs.readFileSync(DB_FILE));
}

function saveUsers() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// ================= USER INIT =================
app.post("/user", (req, res) => {
  const { userId, ref } = req.body;

  if (!users[userId]) {
    users[userId] = {
      balance: 0,
      energy: MAX_ENERGY,
      lastEnergy: Date.now(),
      lastDaily: 0,
      refs: [],
      tasks: {},
      wallet: "",
      withdraws: []
    };
  }

  // ENERGY REGEN
  const now = Date.now();
  const regen = Math.floor((now - users[userId].lastEnergy) / ENERGY_REGEN);
  if (regen > 0) {
    users[userId].energy = Math.min(MAX_ENERGY, users[userId].energy + regen);
    users[userId].lastEnergy = now;
  }

  // REFERRAL
  if (ref && users[ref] && !users[ref].refs.includes(userId)) {
    users[ref].refs.push(userId);
    users[ref].balance += 10;
  }

  saveUsers();
  res.json(users[userId]);
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
    time: Date.now(),
    status: "pending"
  });

  saveUsers();
  res.json({ success: true });
});

// ================= START =================
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

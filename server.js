const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// ================= DATABASE =================
const DB_FILE = "./users.json";
let users = fs.existsSync(DB_FILE)
  ? JSON.parse(fs.readFileSync(DB_FILE))
  : {};

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// ================= TELEGRAM VERIFY =================
function verifyTelegram(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");

  const dataCheck = [...params.entries()]
    .sort()
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = crypto
    .createHash("sha256")
    .update(BOT_TOKEN)
    .digest();

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(dataCheck)
    .digest("hex");

  return hmac === hash;
}

// ================= CREATE / LOAD USER =================
app.post("/user", (req, res) => {
  const { initData } = req.body;

  if (!initData)
    return res.status(403).json({ error: "No init data" });

  if (!verifyTelegram(initData))
    return res.status(403).json({ error: "Auth error" });

  const params = new URLSearchParams(initData);
  const user = JSON.parse(params.get("user"));
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

  saveDB();
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

  saveDB();
  res.json(users[userId]);
});

// ================= DAILY =================
app.post("/daily", (req, res) => {
  const { userId } = req.body;
  if (!users[userId]) return res.json({ error: "User not found" });

  const DAY = 24 * 60 * 60 * 1000;
  if (Date.now() - users[userId].lastDaily < DAY)
    return res.json({ error: "Already claimed" });

  users[userId].lastDaily = Date.now();
  users[userId].balance += 20;

  saveDB();
  res.json({ balance: users[userId].balance });
});

// ================= WALLET =================
app.post("/wallet", (req, res) => {
  const { userId, address } = req.body;
  if (!users[userId]) return res.json({ error: "User not found" });

  users[userId].wallet = address;
  saveDB();

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

// ================= REFERRALS =================
app.get("/referrals", (req, res) => {
  const list = Object.entries(users)
    .map(([id, u]) => ({ id, refs: u.refs.length }))
    .sort((a, b) => b.refs - a.refs)
    .slice(0, 10);

  res.json(list);
});

// ================= START =================
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});

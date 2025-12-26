const express = require("express");
const fs = require("fs");
const path = require("path");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function checkTelegramJoin(userId, channel) {
  const url = `${TELEGRAM_API}/getChatMember?chat_id=@${channel}&user_id=${userId}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) return false;

    const status = data.result.status;
    return ["member", "administrator", "creator"].includes(status);
  } catch (e) {
    return false;
  }
}

const app = express();
app.use(express.json());
app.use(express.static("public"));

const DB_FILE = "./users.json";
let users = {};

if (fs.existsSync(DB_FILE)) {
  users = JSON.parse(fs.readFileSync(DB_FILE));
}

function saveUsers() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// CONFIG
const MAX_ENERGY = 100;
const ENERGY_REGEN = 30000; // 30 sec
const tapCooldown = {};

// ================= USER =================
app.post("/user", (req, res) => {
  const { userId, ref } = req.body;

  if (!users[userId]) {
  users[userId] = {
    balance: 0,
    energy: 100,
    lastEnergy: Date.now(),
    lastDaily: 0,
    refs: []
  };
  }

  // ENERGY REGEN
  const now = Date.now();
  const passed = Math.floor((now - users[userId].lastEnergy) / ENERGY_REGEN);
  if (passed > 0) {
    users[userId].energy = Math.min(MAX_ENERGY, users[userId].energy + passed);
    users[userId].lastEnergy = now;
  }

  // REFERRAL
  if (ref && ref !== userId && users[ref] && !users[ref].refs.includes(userId)) {
    users[ref].balance += 10;
    users[ref].refs.push(userId);
  }

  saveUsers();
  res.json(users[userId]);
});

// ================= TAP =================
app.post("/tap", (req, res) => {
  const { userId } = req.body;
  const now = Date.now();

  if (!users[userId]) return res.json({ error: "User not found" });

  // ENERGY REGEN
  const regenRate = 10000; // 10 seconds
  const passed = Math.floor((now - users[userId].lastEnergy) / regenRate);

  if (passed > 0) {
    users[userId].energy = Math.min(100, users[userId].energy + passed);
    users[userId].lastEnergy = now;
  }

  if (users[userId].energy <= 0) {
    return res.json({ error: "No energy" });
  }

  users[userId].energy -= 1;
  users[userId].balance += 1;

  saveUsers();

  res.json({
    balance: users[userId].balance,
    energy: users[userId].energy
  });
});

// ==========================
// TASK REWARD SYSTEM
// ==========================
app.post("/task", (req, res) => {
  const { userId, type } = req.body;

  if (!users[userId]) {
    return res.json({ error: "User not found" });
  }

  // prevent duplicate reward
  if (!users[userId].tasks) {
    users[userId].tasks = {};
  }

  if (users[userId].tasks[type]) {
    return res.json({ error: "Task already completed" });
  }

  // reward logic
  let reward = 0;

  if (type === "tg") reward = 5;
  if (type === "yt") reward = 5;
  if (type === "chat") reward = 5;

  users[userId].balance += reward;
  users[userId].tasks[type] = true;

  saveUsers();

  res.json({
    success: true,
    reward,
    balance: users[userId].balance
  });
});

app.post("/wallet", (req, res) => {
  const { userId, address } = req.body;

  if (!users[userId]) return res.json({ error: "User not found" });

  users[userId].wallet = address;
  saveUsers();

  res.json({ success: true });
});

// ==========================
// TASK / VERIFY JOIN
// ==========================
app.post("/task", async (req, res) => {
  const { userId, type } = req.body;

  if (!users[userId]) return res.json({ error: "User not found" });

  if (!users[userId].tasks) users[userId].tasks = {};

  if (users[userId].tasks[type]) {
    return res.json({ error: "Already completed" });
  }

  // TELEGRAM CHECK
  if (type === "tg") {
    const joined = await checkTelegramJoin(userId, "YOUR_CHANNEL_USERNAME");
    if (!joined) {
      return res.json({ error: "❌ Join channel first" });
    }
  }

  // REWARD
  const reward = 5;
  users[userId].balance += reward;
  users[userId].tasks[type] = true;

  saveUsers();

  res.json({
    success: true,
    reward,
    balance: users[userId].balance
  });
});

// DAILY REWARD
app.post("/daily", (req, res) => {
  const { userId } = req.body;
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  if (!users[userId]) return res.json({ error: "User not found" });

  if (now - users[userId].lastDaily < DAY) {
    return res.json({ error: "Already claimed" });
  }

  users[userId].balance += 20;
  users[userId].lastDaily = now;
  saveUsers();

  res.json({ reward: 20, balance: users[userId].balance });
});

// ================= ADMIN =================
app.get("/admin", (req, res) => {
  if (req.query.pass !== "admin123") return res.send("Access denied");

  let html = `
  <h2>Admin Panel</h2>
  <table border="1">
  <tr><th>User</th><th>Balance</th><th>Energy</th><th>Refs</th></tr>
  `;

  for (let id in users) {
    html += `<tr>
      <td>${id}</td>
      <td>${users[id].balance}</td>
      <td>${users[id].energy}</td>
      <td>${users[id].refs.length}</td>
    </tr>`;
  }

  html += "</table>";
  res.send(html);
});

app.listen(3000, () => console.log("Server running"));

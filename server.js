const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = "./users.json";

// ==========================
// LOAD USERS
// ==========================
let users = {};
if (fs.existsSync(DB_FILE)) {
  users = JSON.parse(fs.readFileSync(DB_FILE));
}

// ==========================
// SAVE USERS
// ==========================
function saveUsers() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// ==========================
// GET / CREATE USER
// ==========================
app.post("/user", (req, res) => {
  const { userId } = req.body;

  if (!users[userId]) {
    users[userId] = {
      balance: 0,
      energy: 100,
      lastEnergyUpdate: Date.now(),
      refs: []
    };
    saveUsers();
  }

  // Energy regen
  const now = Date.now();
  const diff = Math.floor((now - users[userId].lastEnergyUpdate) / 30000);

  if (diff > 0) {
    users[userId].energy = Math.min(100, users[userId].energy + diff);
    users[userId].lastEnergyUpdate = now;
    saveUsers();
  }

  res.json(users[userId]);
});

// ==========================
// TAP
// ==========================
app.post("/tap", (req, res) => {
  const { userId } = req.body;

  if (!users[userId]) {
    return res.json({ error: "User not found" });
  }

  if (users[userId].energy <= 0) {
    return res.json(users[userId]);
  }

  users[userId].energy -= 1;
  users[userId].balance += 1;

  saveUsers();
  res.json(users[userId]);
});

// ==========================
// REFERRAL COUNT
// ==========================
app.post("/ref-count", (req, res) => {
  const { userId } = req.body;
  const count = users[userId]?.refs?.length || 0;
  res.json({ count });
});

// ==========================
// ADD REFERRAL
// ==========================
app.post("/referral", (req, res) => {
  const { referrerId } = req.body;

  if (users[referrerId]) {
    users[referrerId].refs.push(Date.now());
    users[referrerId].balance += 10;
    saveUsers();
  }

  res.json({ ok: true });
});

// ==========================
// HOME
// ==========================
app.get("/", (req, res) => {
  res.send("TeleTech AI Server Running");
});
// ========================
// ADMIN AUTH (simple)
// ========================
const ADMIN_PASSWORD = "admin123"; // canza daga baya

app.get("/admin", (req, res) => {
  const pass = req.query.pass;

  if (pass !== ADMIN_PASSWORD) {
    return res.send("❌ Access denied");
  }

  res.send(`
    <html>
    <head>
      <title>Admin Dashboard</title>
      <style>
        body { font-family: Arial; background:#0d1117; color:white; padding:20px; }
        table { width:100%; border-collapse: collapse; }
        th, td { border:1px solid #444; padding:8px; }
        th { background:#222; }
      </style>
    </head>
    <body>
      <h2>📊 Admin Dashboard</h2>
      <table>
        <tr>
          <th>User ID</th>
          <th>Balance</th>
          <th>Energy</th>
          <th>Referrals</th>
        </tr>
        ${Object.entries(users).map(([id, u]) => `
          <tr>
            <td>${id}</td>
            <td>${u.balance}</td>
            <td>${u.energy}</td>
            <td>${u.refs?.length || 0}</td>
          </tr>
        `).join("")}
      </table>
    </body>
    </html>
  `);
});
saveUsers()

// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

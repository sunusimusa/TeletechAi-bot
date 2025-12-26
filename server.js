const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// =======================
// STATIC FRONTEND
// =======================
app.use(express.static(path.join(__dirname, "public")));

// =======================
// DATABASE
// =======================
const DB_FILE = "./users.json";
let users = {};

if (fs.existsSync(DB_FILE)) {
  users = JSON.parse(fs.readFileSync(DB_FILE));
}

function saveUsers() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// =======================
// ANTI-SPAM MEMORY
// =======================
const tapCooldown = {};

// =======================
// CREATE / GET USER
// =======================
app.post("/user", (req, res) => {
  const { userId, ref } = req.body;
  if (!userId) return res.json({ error: "No userId" });

  if (!users[userId]) {
    users[userId] = {
      balance: 0,
      energy: 100,
      refs: []
    };
  }

  // ✅ REFERRAL PROTECTION
  if (
    ref &&
    ref !== userId &&
    users[ref] &&
    !users[ref].refs.includes(userId)
  ) {
    users[ref].balance += 10;
    users[ref].refs.push(userId);
  }

  saveUsers();
  res.json(users[userId]);
});

// =======================
// TAP
// =======================
app.post("/tap", (req, res) => {
  const { userId } = req.body;
  if (!users[userId]) return res.json({ error: "User not found" });

  const now = Date.now();

  if (tapCooldown[userId] && now - tapCooldown[userId] < 800) {
    return res.json({ error: "Too fast" });
  }

  tapCooldown[userId] = now;

  if (users[userId].energy <= 0) {
    return res.json(users[userId]);
  }

  users[userId].energy -= 1;
  users[userId].balance += 1;

  saveUsers();
  res.json(users[userId]);
});

// =======================
// REF COUNT
// =======================
app.post("/ref-count", (req, res) => {
  const { userId } = req.body;
  res.json({ count: users[userId]?.refs?.length || 0 });
});

// =======================
// ADMIN PANEL
// =======================
const ADMIN_PASSWORD = "admin123";

app.get("/admin", (req, res) => {
  if (req.query.pass !== ADMIN_PASSWORD)
    return res.send("❌ Access denied");

  let html = `
  <html>
  <head>
    <title>Admin</title>
    <style>
      body { background:#111; color:white; font-family:sans-serif; }
      table { width:100%; border-collapse:collapse; }
      td, th { border:1px solid #333; padding:8px; }
      th { background:#222; }
    </style>
  </head>
  <body>
  <h2>📊 Admin Dashboard</h2>
  <table>
    <tr><th>User</th><th>Balance</th><th>Energy</th><th>Refs</th></tr>
  `;

  for (let id in users) {
    html += `
      <tr>
        <td>${id}</td>
        <td>${users[id].balance}</td>
        <td>${users[id].energy}</td>
        <td>${users[id].refs.length}</td>
      </tr>
    `;
  }

  html += "</table></body></html>";
  res.send(html);
});

// =======================
// FALLBACK
// =======================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));

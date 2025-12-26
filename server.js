const express = require("express");
const fs = require("fs");
const path = require("path");

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
      energy: MAX_ENERGY,
      lastEnergy: Date.now(),
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

  if (tapCooldown[userId] && now - tapCooldown[userId] < 500) {
    return res.json(users[userId]);
  }

  tapCooldown[userId] = now;

  if (users[userId].energy <= 0) return res.json(users[userId]);

  users[userId].energy -= 1;
  users[userId].balance += 1;

  saveUsers();
  res.json(users[userId]);
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

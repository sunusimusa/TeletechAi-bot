const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
const DB_FILE = "./users.json";

// =======================
// LOAD USERS
// =======================
let users = {};
if (fs.existsSync(DB_FILE)) {
  users = JSON.parse(fs.readFileSync(DB_FILE));
}

// =======================
// SAVE USERS
// =======================
function saveUsers() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// =======================
// CREATE / GET USER
// =======================
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

  res.json(users[userId]);
});

// =======================
// TAP ROUTE
// =======================
app.post("/tap", (req, res) => {
  const { userId } = req.body;

  if (!users[userId]) {
    users[userId] = {
      balance: 0,
      energy: 100,
      lastEnergyUpdate: Date.now(),
      refs: []
    };
  }

  if (users[userId].energy <= 0) {
    return res.json({
      balance: users[userId].balance,
      energy: users[userId].energy
    });
  }

  users[userId].balance += 1;
  users[userId].energy -= 1;

  saveUsers();

  res.json({
    balance: users[userId].balance,
    energy: users[userId].energy
  });
});

// =======================
// START SERVER
// =======================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const USERS_FILE = "./data/users.json";

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return {};
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

// GET USER
app.post("/user", (req, res) => {
  const { userId } = req.body;
  let users = loadUsers();

  if (!users[userId]) {
    users[userId] = { balance: 0 };
    saveUsers(users);
  }

  res.json({ balance: users[userId].balance });
});

// TAP
app.post("/tap", (req, res) => {
  const { userId } = req.body;
  let users = loadUsers();

  if (!users[userId]) {
    users[userId] = { balance: 0 };
  }

  users[userId].balance += 1;
  saveUsers(users);

  res.json({ balance: users[userId].balance });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));

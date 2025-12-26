const express = require("express");
const fs = require("fs");
const path = require("path");
const REF_BONUS = 10;

const app = express();
app.use(express.json());
app.use(express.static("public"));

const DB = "./users.json";
let users = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB)) : {};

function save() {
  fs.writeFileSync(DB, JSON.stringify(users, null, 2));
}

app.post("/user", (req, res) => {
  const { userId } = req.body;

  if (!users[userId]) {
    users[userId] = { balance: 0, energy: 100, last: Date.now() };
  }

  const now = Date.now();
  const diff = Math.floor((now - users[userId].last) / 5000);
  if (diff > 0) {
    users[userId].energy = Math.min(100, users[userId].energy + diff);
    users[userId].last = now;
  }

  save();
  res.json(users[userId]);
});

app.post("/tap", (req, res) => {
  const { userId } = req.body;
  if (!users[userId]) return res.json({});

  if (users[userId].energy > 0) {
    users[userId].energy--;
    users[userId].balance++;
  }

  save();
  res.json(users[userId]);
});

app.listen(3000, () => console.log("Running..."));

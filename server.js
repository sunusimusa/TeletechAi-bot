const express = require("express");
const fs = require("fs");
const app = express();

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
app.get("/user/:id", (req, res) => {
  const users = loadUsers();
  const id = req.params.id;

  if (!users[id]) {
    users[id] = {
      balance: 0,
      referredBy: null,
      referrals: 0
    };
    saveUsers(users);
  }

  res.json(users[id]);
});

// TAP
app.post("/tap/:id", (req, res) => {
  const users = loadUsers();
  const id = req.params.id;

  if (!users[id]) {
    users[id] = { balance: 0, referrals: 0 };
  }

  users[id].balance += 1;
  saveUsers(users);

  res.json({ balance: users[id].balance });
});

// REFERRAL
app.get("/ref/:refId/:newId", (req, res) => {
  const { refId, newId } = req.params;
  const users = loadUsers();

  if (!users[newId]) {
    users[newId] = {
      balance: 5,
      referredBy: refId,
      referrals: 0
    };

    if (users[refId]) {
      users[refId].balance += 5;
      users[refId].referrals += 1;
    }
  }

  saveUsers(users);
  res.json({ success: true });
});
app.post("/user", (req, res) => {
  const { userId } = req.body;

  if (!users[userId]) {
    users[userId] = { balance: 0 };
  }

  res.json({ balance: users[userId].balance });
});

app.post("/tap", (req, res) => {
  const { userId } = req.body;

  if (!users[userId]) {
    users[userId] = { balance: 0 };
  }

  users[userId].balance += 1;

  res.json({ balance: users[userId].balance });
});

app.listen(3000, () => console.log("Server running"));

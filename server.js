const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ================= DATABASE =================
const DB_FILE = "./users.json";
let users = fs.existsSync(DB_FILE)
  ? JSON.parse(fs.readFileSync(DB_FILE))
  : {};

function saveUsers() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// ================= USER INIT =================
app.post("/user", (req, res) => {
  const { initData } = req.body;
  const userId = initData?.user?.id || Math.floor(Math.random() * 999999999);

  if (!users[userId]) {
    users[userId] = {
      id: userId,
      balance: 0,
      energy: 100,
      level: 1,
      lastTap: 0
    };
  }

  res.json(users[userId]);
});

// ================= TAP =================
app.post("/user", (req, res) => {
  const { initData } = req.body;

  const userId = initData?.user?.id;
  const ref = initData?.start_param; // referral id

  if (!userId) return res.json({ error: "Invalid user" });

  // Create user if not exists
  if (!users[userId]) {
    users[userId] = {
      id: userId,
      balance: 0,
      energy: 100,
      level: 1,
      lastTap: 0,
      refBy: null,
      referrals: 0
    };

    // 🔥 REFERRAL LOGIC
    if (ref && users[ref] && ref !== userId) {
      users[userId].refBy = ref;
      users[ref].balance += 20; // referral bonus
      users[ref].referrals += 1;
    }

    saveUsers();
  }

  res.json(users[userId]);
});

// ================= DAILY =================
app.post("/daily", (req, res) => {
  const { userId } = req.body;
  const user = users[userId];

  if (!user) return res.json({ error: "User not found" });

  const now = Date.now();
  if (now - (user.lastDaily || 0) < 86400000) {
    return res.json({ error: "Come back tomorrow" });
  }

  user.lastDaily = now;
  user.balance += 50;

  res.json({ balance: user.balance });
});

// ================= LEADERBOARD =================
app.get("/leaderboard", (req, res) => {
  const list = Object.values(users)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10);

  res.json(list);
});

// ================= START =================
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

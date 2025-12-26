const express = require("express");
const fs = require("fs");
const path = require("path");
const REF_BONUS = 10;
const DAILY_REWARD = 50; // zaka iya canza
const MIN_WITHDRAW = 100; // zaka iya canzawa
const ADMIN_PASSWORD = "admin123"; // canza idan kana so

const app = express();
app.use(express.json());
app.use(express.static("public"));

const DB = "./users.json";
let users = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB)) : {};

function save() {
  fs.writeFileSync(DB, JSON.stringify(users, null, 2));
}

app.post("/user", (req, res) => {
  const { userId, ref } = req.body;

  if (!users[userId]) {
    users[userId] = {
      balance: 0,
      energy: 100,
      last: Date.now(),
      referredBy: ref || null,
      rewarded: false
    };

    // give referral reward
    if (ref && users[ref] && !users[userId].rewarded) {
      users[ref].balance += REF_BONUS;
      users[userId].rewarded = true;
    }
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
app.post("/daily", (req, res) => {
  const { userId } = req.body;

  if (!users[userId]) return res.json({ error: "User not found" });

  const now = Date.now();
  const lastClaim = users[userId].lastDaily || 0;
  const diff = now - lastClaim;

  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.ceil((24*60*60*1000 - diff) / 3600000);
    return res.json({ error: `Come back in ${hours} hours` });
  }

  users[userId].balance += DAILY_REWARD;
  users[userId].lastDaily = now;

  save();
  res.json({
    success: true,
    reward: DAILY_REWARD,
    balance: users[userId].balance
  });
});
// ==========================
// WITHDRAW REQUEST
// ==========================
app.post("/withdraw", (req, res) => {
  const { userId, wallet } = req.body;

  if (!users[userId]) {
    return res.json({ error: "User not found" });
  }

  if (!wallet || wallet.length < 5) {
    return res.json({ error: "Invalid wallet address" });
  }

  if (users[userId].balance < MIN_WITHDRAW) {
    return res.json({ error: `Minimum withdraw is ${MIN_WITHDRAW}` });
  }

  // =======================
// ADMIN DASHBOARD
// =======================
app.get("/admin", (req, res) => {
  const pass = req.query.pass;
  if (pass !== ADMIN_PASSWORD) {
    return res.send("❌ Access Denied");
  }

  let html = `
  <h2>Withdraw Requests</h2>
  <table border="1" cellpadding="10">
    <tr>
      <th>User</th>
      <th>Amount</th>
      <th>Wallet</th>
      <th>Status</th>
      <th>Action</th>
    </tr>
  `;

  for (const userId in users) {
    const u = users[userId];
    if (!u.withdraws) continue;

    u.withdraws.forEach((w, index) => {
      html += `
        <tr>
          <td>${userId}</td>
          <td>${w.amount}</td>
          <td>${w.wallet}</td>
          <td>${w.status}</td>
          <td>
            ${
              w.status === "pending"
                ? `<a href="/approve?uid=${userId}&i=${index}&pass=${pass}">Approve</a>`
                : "Done"
            }
          </td>
        </tr>
      `;
    });
  }

  html += "</table>";
  res.send(html);
});
  // save withdraw request
  if (!users[userId].withdraws) users[userId].withdraws = [];

  users[userId].withdraws.push({
    amount: users[userId].balance,
    wallet,
    time: Date.now(),
    status: "pending"
  });

  users[userId].balance = 0;

  save();
  res.json({ success: true });
});

app.listen(3000, () => console.log("Running..."));

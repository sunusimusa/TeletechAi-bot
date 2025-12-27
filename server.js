const express = require("express");
const fs = require("fs");
const path = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(express.json());
app.use(express.static("public"));

// ================= CONFIG =================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const DB_FILE = "./users.json";
const MAX_ENERGY = 100;
const ENERGY_REGEN = 30000; // 30s

let users = fs.existsSync(DB_FILE)
  ? JSON.parse(fs.readFileSync(DB_FILE))
  : {};

function saveUsers() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// ================= TELEGRAM CHECK =================
async function checkTelegramJoin(userId, channel) {
  try {
    const res = await fetch(
      `${TELEGRAM_API}/getChatMember?chat_id=@${channel}&user_id=${userId}`
    );
    const data = await res.json();
    if (!data.ok) return false;
    return ["member", "administrator", "creator"].includes(
      data.result.status
    );
  } catch {
    return false;
  }
}

// ================= USER INIT =================
app.post("/user", (req, res) => {
  const { userId, ref } = req.body;

  if (!users[userId]) {
    users[userId] = {
      balance: 0,
      energy: 100,
      lastEnergy: Date.now(),
      lastDaily: 0,
      refs: [],
      tasks: {},
      wallet: "",
      withdraws: []
    };
  }

  // referral
  if (ref && ref !== userId && users[ref] && !users[ref].refs.includes(userId)) {
    users[ref].refs.push(userId);
    users[ref].balance += 10;
  }

  // energy regen
  const now = Date.now();
  const diff = Math.floor((now - users[userId].lastEnergy) / ENERGY_REGEN);
  if (diff > 0) {
    users[userId].energy = Math.min(MAX_ENERGY, users[userId].energy + diff);
    users[userId].lastEnergy = now;
  }

  saveUsers();
  res.json(users[userId]);
});

// ================= TAP =================
app.post("/tap", (req, res) => {
  const { userId } = req.body;
  if (!users[userId]) return res.json({ error: "User not found" });

  if (users[userId].energy <= 0)
    return res.json({ error: "No energy" });

  users[userId].energy -= 1;
users[userId].lastEnergy = Date.now(); // ADD THIS
users[userId].balance += 1;

  saveUsers();
  res.json({
    balance: users[userId].balance,
    energy: users[userId].energy
  });
});

// ================= DAILY =================
app.post("/daily", (req, res) => {
  const { userId } = req.body;
  const DAY = 86400000;

  if (!users[userId]) return res.json({ error: "User not found" });

  if (Date.now() - users[userId].lastDaily < DAY)
    return res.json({ error: "Already claimed" });

  users[userId].lastDaily = Date.now();
  users[userId].balance += 20;

  saveUsers();
  res.json({ reward: 20, balance: users[userId].balance });
});

// ================= TASK =================
app.post("/task", async (req, res) => {
  const { userId, type } = req.body;

  if (!users[userId]) return res.json({ error: "User not found" });

  if (users[userId].tasks[type])
    return res.json({ error: "Task already done" });

  if (type === "tg") {
    const ok = await checkTelegramJoin(userId, "YOUR_CHANNEL_USERNAME");
    if (!ok) return res.json({ error: "Join Telegram first" });
  }

  users[userId].tasks[type] = true;
  users[userId].balance += 5;

  saveUsers();
  res.json({ success: true, reward: 5, balance: users[userId].balance });
});

// ================= WITHDRAW =================
app.post("/withdraw", (req, res) => {
  const { userId, amount } = req.body;

  if (!users[userId]) return res.json({ error: "User not found" });
  if (amount < 100) return res.json({ error: "Minimum withdraw is 100" });
  if (users[userId].balance < amount)
    return res.json({ error: "Not enough balance" });

  users[userId].withdraws.push({
    amount,
    status: "pending",
    time: Date.now()
  });

  users[userId].balance -= amount;
  saveUsers();

  res.json({ success: true });
});

// ================= ADMIN PANEL =================
app.get("/admin", (req, res) => {
  if (req.query.pass !== "admin123") return res.send("Access denied");

  let html = `<h2>Withdraw Requests</h2>`;

  for (let uid in users) {
    users[uid].withdraws.forEach((w, i) => {
      html += `
        <div style="border:1px solid #ccc;padding:10px;margin:10px">
          <b>User:</b> ${uid}<br/>
          <b>Amount:</b> ${w.amount}<br/>
          <b>Status:</b> ${w.status}<br/>
          <a href="/admin/approve?uid=${uid}&i=${i}&pass=admin123">✅ Approve</a>
        </div>`;
    });
  }

  res.send(html);
});

// ================= APPROVE =================
app.get("/admin/approve", (req, res) => {
  const { uid, i, pass } = req.query;
  if (pass !== "admin123") return res.send("Denied");

  if (!users[uid] || !users[uid].withdraws[i])
    return res.send("Invalid request");

  users[uid].withdraws[i].status = "approved";
  saveUsers();

  res.send("✅ Withdrawal Approved");
});

// ================= START =================
app.listen(3000, () => {
  console.log("✅ Server running on port 3000");
});

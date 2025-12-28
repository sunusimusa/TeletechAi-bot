const express = require("express");
const fs = require("fs");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ================= CONFIG =================
const ENERGY_MAX = 100;
const ENERGY_REGEN_TIME = 5000;

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL = process.env.CHANNEL_USERNAME;
const GROUP = process.env.GROUP_USERNAME;

// ================= DATABASE =================
const DB_FILE = "./users.json";
let users = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE)) : {};

function saveUsers() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// ================= UTILITIES =================
function updateLevel(user) {
  const lvl = Math.floor(user.balance / 100) + 1;
  if (lvl > user.level) {
    user.level = lvl;
    user.energy = Math.min(ENERGY_MAX, user.energy + 10);
  }
}

function regenEnergy(user) {
  const now = Date.now();
  const diff = Math.floor((now - user.lastEnergyUpdate) / ENERGY_REGEN_TIME);
  if (diff > 0) {
    user.energy = Math.min(ENERGY_MAX, user.energy + diff);
    user.lastEnergyUpdate = now;
  }
}

async function sendMessage(userId, text) {
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: userId,
      text,
      parse_mode: "HTML"
    });
  } catch (e) {
    console.log("TG error:", e.message);
  }
}

async function isMember(userId, chat) {
  try {
    const res = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`,
      { params: { chat_id: chat, user_id: userId } }
    );
    return ["member", "administrator", "creator"].includes(res.data.result.status);
  } catch {
    return false;
  }
}

// ================= USER INIT =================
app.post("/user", async (req, res) => {
  const { initData } = req.body;
  const userId = initData?.user?.id;
  const ref = initData?.start_param;

  if (!userId) return res.json({ error: "Invalid user" });

  if (!users[userId]) {
    users[userId] = {
      id: userId,
      balance: 0,
      token: 0,
      level: 1,
      energy: ENERGY_MAX,
      lastEnergyUpdate: Date.now(),
      lastDaily: 0,
      refBy: null,
      referrals: 0,
      tasks: { youtube: false, channel: false, group: false }
    };

    if (ref && users[ref] && ref !== userId) {
      users[ref].balance += 20;
      users[ref].referrals += 1;
      users[userId].refBy = ref;
    }

    await sendMessage(
      userId,
      `👋 Welcome to *TeleTap AI*\n\n💰 Earn by tapping\n🎁 Daily rewards\n👥 Invite friends`
    );

    saveUsers();
  }

  res.json(users[userId]);
});

// ================= TAP =================
app.post("/tap", (req, res) => {
  const user = users[req.body.userId];
  if (!user) return res.json({ error: "User not found" });

  regenEnergy(user);

  if (user.energy <= 0)
    return res.json({ error: "No energy", balance: user.balance });

  user.energy--;
  user.balance++;
  updateLevel(user);
  saveUsers();

  res.json({
    balance: user.balance,
    energy: user.energy,
    level: user.level
  });
});

// ================= DAILY =================
app.post("/daily", (req, res) => {
  const user = users[req.body.userId];
  if (!user) return res.json({ error: "User not found" });

  if (Date.now() - user.lastDaily < 86400000)
    return res.json({ error: "Come back tomorrow" });

  user.lastDaily = Date.now();
  user.balance += 50;
  saveUsers();

  res.json({ balance: user.balance });
});

// ================= TASK VERIFY =================
app.post("/task", async (req, res) => {
  const { userId, type } = req.body;
  const user = users[userId];
  if (!user) return res.json({ error: "User not found" });

  if (user.tasks[type]) return res.json({ success: true, balance: user.balance });

  let ok = false;

  if (type === "youtube") ok = true;
  if (type === "channel") ok = await isMember(userId, CHANNEL);
  if (type === "group") ok = await isMember(userId, GROUP);

  if (!ok) return res.json({ error: "Not verified" });

  user.tasks[type] = true;
  user.balance += 20;

  saveUsers();
  res.json({ success: true, balance: user.balance });
});

// ================= STATS =================
app.get("/leaderboard", (req, res) => {
  res.json(Object.values(users).sort((a, b) => b.balance - a.balance).slice(0, 10));
});

app.get("/top-referrals", (req, res) => {
  res.json(Object.values(users).sort((a, b) => b.referrals - a.referrals).slice(0, 10));
});

app.get("/stats", (req, res) => {
  res.json({ total: Object.keys(users).length });
});

// ================= START =================
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

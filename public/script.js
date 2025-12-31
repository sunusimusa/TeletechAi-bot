// ================= TELEGRAM INIT =================
const tg = window.Telegram.WebApp;
tg.expand();

let USER_ID = null;
let balance = 0;
let energy = 0;
let level = 1;
let maxEnergy = 100;
let regenInterval = null;

// ================= INIT =================
async function init() {
  const tgUser = tg.initDataUnsafe?.user;

  if (!tgUser || !tgUser.id) {
    alert("❌ Open this bot from Telegram");
    return;
  }

  USER_ID = tgUser.id; // ✅ MUHIMMI

  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: USER_ID,
      initData: tg.initDataUnsafe
    })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  balance = data.balance ?? 0;
  energy = data.energy ?? 0;
  level = data.level ?? 1;

  updateUI();
  setReferralLink();
  loadLeaderboard();
  loadTopRefs();
  loadStats();
  startEnergyRegen();
}

async function main() {
  await init();
}

main();

// ================= UI =================
function updateUI() {
  document.getElementById("balance").innerText = balance;
  document.getElementById("energy").innerText = energy;
  document.getElementById("level").innerText = level;

  const bar = document.getElementById("energyFill");
  if (bar) bar.style.width = Math.min(energy, 100) + "%";
}

// ================= TAP =================
async function tap() {
  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  balance = data.balance;
  energy = data.energy;
  level = data.level;

  updateUI();
}

// ================= DAILY =================
function daily() {
  fetch("/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  })
    .then(r => r.json())
    .then(data => {
      if (data.error) return alert(data.error);
      alert("🎁 Daily reward claimed!");
      balance = data.balance;
      updateUI();
    });
}

// ================= OPEN BOX =================
function openBox() {
  fetch("/open-box", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  })
    .then(r => r.json())
    .then(data => {
      if (data.error) return alert(data.error);
      alert("🎁 You got " + data.reward + " coins");
      balance = data.balance;
      updateUI();
    });
}

// ================= SPIN =================
function spin() {
  fetch("/spin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  })
    .then(r => r.json())
    .then(data => {
      if (data.error) return alert(data.error);
      alert("🎉 You won: " + data.reward);
      balance = data.balance;
      energy = data.energy;
      updateUI();
    });
}

async function attack() {
  if (!USER_ID) {
    alert("No user id");
    return;
  }

  const res = await fetch("/game-win", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: USER_ID,
      reward: 5
    })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  alert("🔥 You won +5 coins!");
}

// ================= ADS =================
function watchAd() {
  setTimeout(async () => {
    const res = await fetch("/ads-spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: USER_ID })
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    balance = data.balance;
    energy = data.energy;
    updateUI();
  }, 3000);
}

// ================= CONVERT =================
function convertToken() {
  fetch("/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  })
    .then(r => r.json())
    .then(data => {
      if (data.error) return alert(data.error);
      document.getElementById("token").innerText = data.tokens;
      balance = data.balance;
      updateUI();
    });
}

// ================= WITHDRAW =================
function withdraw() {
  const wallet = document.getElementById("wallet").value;
  if (!wallet) return alert("Enter wallet address");

  fetch("/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID, wallet })
  })
    .then(r => r.json())
    .then(data => {
      if (data.error) return alert(data.error);
      alert("✅ Withdrawal sent!");
    });
}

// ================= REFERRAL =================
function setReferralLink() {
  const input = document.getElementById("refLink");
  if (!input) return;
  input.value = `https://t.me/TeletechAi_bot?start=${USER_ID}`;
}

function copyInvite() {
  const input = document.getElementById("refLink");
  navigator.clipboard.writeText(input.value);
  alert("✅ Invite link copied!");
}

// ================= TASKS =================
function openTask(type) {
  if (type === "youtube") window.open("https://youtube.com/@Sunusicrypto");
  if (type === "channel") window.open("https://t.me/TeleAIupdates");
  if (type === "group") window.open("https://t.me/tele_tap_ai");

  setTimeout(async () => {
    const res = await fetch("/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: USER_ID, type })
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    balance = data.balance;
    updateUI();
  }, 3000);
}

// ================= STATS =================
function loadLeaderboard() {
  fetch("/leaderboard")
    .then(r => r.json())
    .then(d => {
      document.getElementById("board").innerHTML =
        d.map((u, i) => `#${i + 1} - ${u.balance}`).join("<br>");
    });
}

function loadTopRefs() {
  fetch("/top-referrals")
    .then(r => r.json())
    .then(d => {
      document.getElementById("topRefs").innerHTML =
        d.map((u, i) => `#${i + 1} ${u.telegramId} (${u.referrals})`).join("<br>");
    });
}

function loadStats() {
  fetch("/stats")
    .then(r => r.json())
    .then(d => {
      document.getElementById("totalUsers").innerText = d.total;
    });
}

// ================= ENERGY =================
function startEnergyRegen() {
  if (regenInterval) return;
  regenInterval = setInterval(() => {
    if (energy < maxEnergy) {
      energy++;
      updateUI();
    }
  }, 10000);
}

// ================= MENU =================
function openMenu() {
  document.getElementById("sideMenu").style.left = "0";
}
function closeMenu() {
  document.getElementById("sideMenu").style.left = "-260px";
}

// ================= ROADMAP =================
function openRoadmap() {
  alert(`🚀 TELE TECH AI ROADMAP

PHASE 1 ✅
Tap • Daily • Referral

PHASE 2 🔜
Token • Spin • Energy Boost

PHASE 3 🔜
Withdraw • NFT

PHASE 4 🔜
Airdrop • Mobile App`);
}

// ================= WHITEPAPER =================
function openWhitepaper() {
  window.open("/whitepaper.html", "_blank");
                              }

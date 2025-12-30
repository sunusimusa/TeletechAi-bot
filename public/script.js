// ================= INIT =================
const tg = window.Telegram?.WebApp;
tg?.expand();

let USER_ID = null;
let balance = 0;
let energy = 0;
let level = 1;
let maxEnergy = 100;
let regenInterval = null;

// ================= LOAD USER =================
async function init() {
  const tgUser = tg?.initDataUnsafe?.user;
  if (!tgUser) return alert("Please open via Telegram");

  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: tgUser.id,
      initData: tg.initDataUnsafe
    })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  USER_ID = data.id;
  balance = data.balance;
  energy = data.energy;
  level = data.level;

  updateUI();
  startEnergyRegen();
  setReferralLink();
  loadStats();
  loadLeaderboard();
  loadTopRefs();
}

init();

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
    .then(d => {
      if (d.error) return alert(d.error);
      balance = d.balance;
      updateUI();
      alert("🎁 Daily reward claimed!");
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
    .then(d => {
      if (d.error) return alert(d.error);
      balance = d.balance;
      updateUI();
      alert("🎁 You got " + d.reward + " coins");
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
    .then(d => {
      if (d.error) return alert(d.error);
      balance = d.balance;
      energy = d.energy;
      updateUI();
      alert("🎉 You won: " + d.reward);
    });
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
    .then(d => {
      if (d.error) return alert(d.error);
      document.getElementById("token").innerText = d.tokens;
      balance = d.balance;
      updateUI();
      alert("✅ Converted!");
    });
}

// ================= WITHDRAW =================
function withdraw() {
  const wallet = document.getElementById("wallet").value;
  if (!wallet) return alert("Enter wallet");

  fetch("/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID, wallet })
  })
    .then(r => r.json())
    .then(d => {
      if (d.error) return alert(d.error);
      alert("✅ Withdrawal sent!");
    });
}

// ================= TASK =================
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
    alert("✅ Task completed!");
  }, 3000);
}

// ================= REFERRAL =================
function setReferralLink() {
  const input = document.getElementById("refLink");
  if (input)
    input.value = `https://t.me/TeletechAi_bot?start=${USER_ID}`;
}

// ================= LEADERBOARD =================
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
        d.map((u, i) => `#${i + 1} ${u.telegramId}`).join("<br>");
    });
}

// ================= ENERGY REGEN =================
function startEnergyRegen() {
  if (regenInterval) return;
  regenInterval = setInterval(() => {
    if (energy < maxEnergy) {
      energy++;
      document.getElementById("energy").innerText = energy;
      document.getElementById("energyFill").style.width = energy + "%";
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

// ================= STATS =================
function loadStats() {
  fetch("/stats")
    .then(r => r.json())
    .then(d => {
      document.getElementById("totalUsers").innerText = d.total;
    });
        }

// ================== ROADMAP ==================
function openRoadmap() {
  alert(`🚀 TELE TECH AI ROADMAP

PHASE 1 ✅
Tap • Referral • Daily

PHASE 2 🔜
Token • Energy Boost • Spin

PHASE 3 🔜
Withdraw • NFT

PHASE 4 🔜
Airdrop • Mobile App`);
}

// ================== WHITEPAPER ==================
function openWhitepaper() {
  window.open("/whitepaper.html", "_blank");
}

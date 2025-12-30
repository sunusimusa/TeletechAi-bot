const tg = window.Telegram.WebApp;
tg.expand();

let maxEnergy = 100;
let regenInterval = null;
let USER_ID = null;
let balance = 0;
let energy = 0;
let level = 1;

// ================= INIT =================
async function init() {
  const tgUser = tg.initDataUnsafe?.user;
  if (!tgUser) return alert("Please reopen the bot");

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

  USER_ID = data.telegramId || data.id;
  balance = Number(data.balance) || 0;
  energy = Number(data.energy) || 0;
  level = Number(data.level) || 1;

  updateUI();
  startEnergyRegen();
  setReferralLink();
  loadLeaderboard();
  loadTopRefs();
  loadStats();
}

init();

// ================= UI UPDATE =================
function updateUI() {
  document.getElementById("balance").innerText = balance;
  document.getElementById("energy").innerText = energy;
  document.getElementById("level").innerText = level;

  const bar = document.getElementById("energyFill");
  if (bar) bar.style.width = Math.min(energy, 100) + "%";
}

// ================= TAP =================
async function tap() {
  if (energy <= 0) {
    document.getElementById("tapResult").innerText = "⚡ No Energy!";
    return;
  }

  const btn = document.querySelector(".tap-btn");
  btn.classList.add("tap-animate");

  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  });

  const data = await res.json();

  if (data.error) {
    document.getElementById("tapResult").innerText = data.error;
    btn.classList.remove("tap-animate");
    return;
  }

  // 🔥 real values from server
  balance = data.balance;
  energy = data.energy;
  level = data.level;

  updateUI();

  document.getElementById("tapResult").innerText = "🔥 +1 Coin!";
  setTimeout(() => btn.classList.remove("tap-animate"), 120);
}

// ================= DAILY =================
async function daily() {
  const res = await fetch("/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  balance = data.balance;
  updateUI();
  alert("🎁 Daily reward claimed!");
}

// ================= OPEN BOX =================
async function openBox() {
  const res = await fetch("/open-box", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  balance = data.balance;
  updateUI();
  alert(`🎁 You got ${data.reward} coins!`);
}

// ================= ADS =================
async function watchAd() {
  alert("📺 Watching Ad...");

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

async function convertToken() {
  if (balance < 100) {
    alert("❌ You need at least 100 coins to convert.");
    return;
  }

  const res = await fetch("/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  balance = data.balance;
  document.getElementById("balance").innerText = balance;

  document.getElementById("token").innerText = data.tokens;

  alert("✅ Converted successfully!");
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
        d.map((u, i) => `#${i + 1} — ${u.balance}`).join("<br>");
    });
}

function loadTopRefs() {
  fetch("/top-referrals")
    .then(r => r.json())
    .then(d => {
      document.getElementById("topRefs").innerHTML =
        d.map((u, i) => `#${i + 1} ${u.telegramId} (${u.referrals})`).join("");
    });
}

// ================= TASK =================
function openTask(type) {
  if (type === "youtube") {
    window.open("https://youtube.com/@Sunusicrypto", "_blank");
  }

  if (type === "channel") {
    window.open("https://t.me/TeleAIupdates", "_blank");
  }

  if (type === "group") {
    window.open("https://t.me/tele_tap_ai", "_blank");
  }

  // wait few seconds before reward
  setTimeout(async () => {
    try {
      const res = await fetch("/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: USER_ID,
          type: type
        })
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      // update balance
      balance = data.balance;
      updateUI();

      alert("✅ Task completed! Reward added.");
    } catch (err) {
      console.error(err);
      alert("❌ Network error");
    }
  }, 3000);
}

// ================= STATS =================
function loadStats() {
  fetch("/stats")
    .then(r => r.json())
    .then(d => {
      document.getElementById("totalUsers").innerText = d.total;
    });
}

function startEnergyRegen() {
  if (regenInterval) return;

  regenInterval = setInterval(() => {
    if (energy < maxEnergy) {
      energy += 1;
      document.getElementById("energy").innerText = energy;
      document.getElementById("energyFill").style.width = energy + "%";
    }
  }, 10000); // every 10 seconds
}

// ================= MENU =================
function openMenu() {
  document.getElementById("sideMenu").style.left = "0";
}
function closeMenu() {
  document.getElementById("sideMenu").style.left = "-260px";
}

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

/* ================= GLOBAL STATE ================= */
let balance = 0;
let tokens = 0;
let energy = 50;
let maxEnergy = 100;
let freeTries = 3;
let proLevel = 0; // 0 free, 1-3 pro, 4 founder

let openingLocked = false;

/* ================= SOUNDS ================= */
const sounds = {
  click: document.getElementById("clickSound"),
  win: document.getElementById("winSound"),
  lose: document.getElementById("loseSound")
};

let soundUnlocked = false;

document.addEventListener("click", () => {
  if (soundUnlocked) return;
  Object.values(sounds).forEach(s => {
    if (!s) return;
    s.volume = 0;
    s.play().then(() => {
      s.pause();
      s.currentTime = 0;
      s.volume = 1;
    }).catch(() => {});
  });
  soundUnlocked = true;
}, { once: true });

function playSound(type) {
  if (!soundUnlocked) return;
  const s = sounds[type];
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}

/* ================= UI ================= */
function updateUI() {
  document.getElementById("balance").innerText = `Balance: ${balance}`;
  document.getElementById("tokens").innerText = `Tokens: ${tokens}`;
  document.getElementById("freeTries").innerText = `Free tries: ${freeTries}`;
  document.getElementById("energy").innerText =
    `Energy: ${energy} / ${maxEnergy}`;

  const fill = document.getElementById("energyFill");
  if (fill) {
    fill.style.width = Math.min((energy / maxEnergy) * 100, 100) + "%";
  }

  // Founder dashboard
  const founderBox = document.getElementById("founderActions");
  if (proLevel >= 4) {
    founderBox?.classList.remove("hidden");
  } else {
    founderBox?.classList.add("hidden");
  }
}

/* ================= OPEN BOX ================= */
document.querySelectorAll(".box").forEach(box => {
  box.addEventListener("click", () => openBox(box));
});

function openBox(box) {
  if (openingLocked) return;

  if (freeTries <= 0 && energy < 10) {
    alert("❌ No energy");
    return;
  }

  openingLocked = true;
  playSound("click");

  if (freeTries > 0) freeTries--;
  else energy -= 10;

  const rewards =
    proLevel >= 4 ? [500, 1000, 2000] :
    proLevel === 3 ? [200, 500, 1000] :
    proLevel === 2 ? [100, 200, 500] :
    proLevel === 1 ? [50, 100, 200] :
    [0, 50, 100];

  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  box.classList.add("opened");
  if (reward > 0) {
    box.innerText = `💰 ${reward}`;
    balance += reward;
    playSound("win");
  } else {
    box.innerText = "😢";
    playSound("lose");
  }

  updateUI();

  setTimeout(() => {
    box.classList.remove("opened");
    box.innerText = "";
    openingLocked = false;
  }, 1200);
}

/* ================= DAILY BONUS ================= */
document.getElementById("dailyBtn")?.addEventListener("click", () => {
  const today = new Date().toDateString();
  if (localStorage.getItem("daily") === today) {
    alert("⏳ Already claimed");
    return;
  }

  let reward = 500;
  if (proLevel === 1) reward *= 1.3;
  if (proLevel === 2) reward *= 1.7;
  if (proLevel === 3) reward *= 2;
  if (proLevel >= 4) reward *= 3;

  balance += Math.floor(reward);
  energy = Math.min(maxEnergy, energy + 10);

  localStorage.setItem("daily", today);
  document.getElementById("dailyMsg").innerText = "🎉 Daily claimed!";
  updateUI();
});

/* ================= CONVERT ================= */
document.getElementById("convertBtn")?.addEventListener("click", () => {
  if (balance < 10000) {
    alert("❌ Not enough balance");
    return;
  }
  balance -= 10000;
  tokens += 1;
  document.getElementById("convertMsg").innerText = "✅ Converted!";
  updateUI();
});

/* ================= BUY ENERGY ================= */
document.querySelectorAll("button[data-energy]").forEach(btn => {
  btn.addEventListener("click", () => {
    const amount = Number(btn.dataset.energy);
    const cost = amount === 100 ? 500 : 2000;

    if (balance < cost) {
      alert("❌ Not enough coins");
      return;
    }

    balance -= cost;
    energy = Math.min(maxEnergy, energy + amount);
    updateUI();
  });
});

/* ================= TOKEN MARKET ================= */
document.getElementById("buyTokenBtn")?.addEventListener("click", () => {
  if (balance < 10000) return alert("❌ Not enough coins");
  balance -= 10000;
  tokens += 1;
  updateUI();
});

document.getElementById("sellTokenBtn")?.addEventListener("click", () => {
  if (tokens < 1) return alert("❌ No tokens");
  tokens -= 1;
  balance += 9000;
  updateUI();
});

/* ================= PRO UPGRADE ================= */
document.querySelectorAll("button[data-pro]").forEach(btn => {
  btn.addEventListener("click", () => {
    const level = Number(btn.dataset.pro);
    const prices = { 1: 5, 2: 10, 3: 20 };

    if (proLevel >= level) {
      alert("Already upgraded");
      return;
    }
    if (tokens < prices[level]) {
      alert("❌ Not enough tokens");
      return;
    }

    tokens -= prices[level];
    proLevel = level;
    maxEnergy = level === 1 ? 150 : level === 2 ? 200 : 300;

    alert(`🚀 PRO Level ${level} activated`);
    updateUI();
  });
});

/* ================= FOUNDER STATS ================= */
document.getElementById("founderStatsBtn")?.addEventListener("click", () => {
  alert(
    "👑 FOUNDER DASHBOARD\n\n" +
    `Balance: ${balance}\nTokens: ${tokens}\nEnergy: ${energy}`
  );
});

/* ================= AGREEMENT ================= */
function checkAgreement() {
  if (!localStorage.getItem("agreed")) {
    document.getElementById("agreementModal")?.classList.remove("hidden");
  }
}

document.getElementById("agreeBtn")?.addEventListener("click", () => {
  localStorage.setItem("agreed", "yes");
  document.getElementById("agreementModal")?.classList.add("hidden");
});

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  // Founder auto (example)
  const FOUNDER_USER_ID = "SUNUSI_001";
  const currentUser = localStorage.getItem("userId") || FOUNDER_USER_ID;

  if (currentUser === FOUNDER_USER_ID) {
    proLevel = 4;
    maxEnergy = 9999;
    energy = 9999;
    freeTries = 9999;
  }

  checkAgreement();
  updateUI();
});

// ================== TELEGRAM ==================
if (!window.Telegram || !Telegram.WebApp || !Telegram.WebApp.initDataUnsafe?.user) {
  alert("❌ Please open this game from Telegram");
  throw new Error("Not opened inside Telegram");
}

const tg = Telegram.WebApp;
tg.expand();

const TELEGRAM_ID = String(tg.initDataUnsafe.user.id);

// ================== GLOBAL STATE ==================
let balance = 0;
let energy = 0;
let tokens = 0;
let freeTries = 0;
let referralCode = "";
let referralsCount = 0;
let openedCount = 0;
let soundEnabled = true;
let openingLocked = false;

// 🔥 PRO STATE
let proLevel = 0;
let isPro = false;
let role = "user";

let MAX_ENERGY = 100;

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", async () => {
  await loadUser();

  // 🔄 AUTO REFRESH USER DATA
  setInterval(loadUser, 5000);
});

// ================== LOAD USER ==================
async function loadUser() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegramId: TELEGRAM_ID,
        ref: tg.initDataUnsafe?.start_param || null
      })
    });

    const data = await res.json();
    if (data.error) throw data.error;

    balance = data.balance ?? 0;
    energy = data.energy ?? 0;
    tokens = data.tokens ?? 0;
    freeTries = data.freeTries ?? 0;
    referralCode = data.referralCode ?? "";
    referralsCount = data.referralsCount ?? 0;

    // ✅ PRO DATA
    proLevel = data.proLevel ?? 0;
    isPro = data.isPro ?? false;
    role = data.role ?? "user";

    // 🔥 MAX ENERGY BY LEVEL
    MAX_ENERGY = 100;
    if (proLevel === 1) MAX_ENERGY = 150;
    if (proLevel === 2) MAX_ENERGY = 200;
    if (proLevel === 3) MAX_ENERGY = 300;
    if (proLevel >= 4) MAX_ENERGY = 9999;

    // 🔗 Referral link
    if (referralCode) {
      document.getElementById("refLink").value =
        `https://t.me/teletechai_bot?start=${referralCode}`;
    }

    updateUI();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to load user");
  }
}

// ================== UI UPDATE ==================
function updateUI() {
  document.getElementById("balance").innerText = `Balance: ${balance}`;
  document.getElementById("energy").innerText = `Energy: ${energy} / ${MAX_ENERGY}`;
  document.getElementById("tokens").innerText = `Tokens: ${tokens}`;
  document.getElementById("refCount").innerText = `👥 Referrals: ${referralsCount}`;

const percent = Math.min((energy / MAX_ENERGY) * 100, 100);
const bar = document.getElementById("energyFill");
if (bar) bar.style.width = percent + "%";
  
  // 👑 FOUNDER BADGE
  if (proLevel >= 4) {
    const badge = document.getElementById("proBadge");
    if (badge) {
      badge.innerText = "👑 FOUNDER";
      badge.classList.remove("hidden");
    }

    document.getElementById("upgradeBtn")?.remove();
    document.getElementById("proLv2Btn")?.remove();
    document.getElementById("proLv3Btn")?.remove();
  }

  document.addEventListener("DOMContentLoaded", () => {
  const seen = localStorage.getItem("tutorial_seen");

  if (!seen) {
    alert(
      "👋 Welcome to TeleTech AI!\n\n" +
      "🎁 Claim Daily Bonus\n" +
      "⚡ Use Energy to open boxes\n" +
      "👥 Invite friends to earn more\n" +
      "🚀 Upgrade to PRO for benefits"
    );
    localStorage.setItem("tutorial_seen", "yes");
  }
});
}

// ================== SOUND ==================
function playSound(type) {
  if (!soundEnabled) return;

  const sounds = {
    click: "clickSound",
    win: "winSound",
    lose: "loseSound",
    error: "errorSound"
  };

  const audio = document.getElementById(sounds[type]);
  if (!audio) return;

  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// ================== OPEN BOX ==================
async function openBox(box) {
  if (openingLocked || box.classList.contains("opened")) return;

  openingLocked = true;
  playSound("click");

  try {
    const res = await fetch("/api/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();
    if (data.error) throw data.error;

    box.classList.add("opened");

    if (data.reward === 0) {
      box.innerText = "😢";
      playSound("lose");
    } else {
      box.innerText = `💰 ${data.reward}`;
      playSound("win");
    }

    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;

    updateUI();

    openedCount++;

    setTimeout(() => {
      box.classList.remove("opened");
      box.innerText = "";
    }, 1500);

    setTimeout(() => {
      openingLocked = false;
    }, 300);

    if (openedCount >= 6) {
      setTimeout(resetAllBoxes, 1800);
    }

  } catch (err) {
    playSound("error");
    document.getElementById("msg").innerText = err;
    openingLocked = false;
  }
}

function resetAllBoxes() {
  document.querySelectorAll(".box").forEach(b => {
    b.classList.remove("opened", "rare");
    b.innerText = "";
  });
  openedCount = 0;
}

function buy100Energy() {
  buyEnergy(100);
}

function buy500Energy() {
  buyEnergy(500);
}

async function buyEnergy(amount) {
  const res = await fetch("/api/buy-energy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: TELEGRAM_ID,
      amount
    })
  });

  const data = await res.json();
  if (data.error) {
    alert("❌ " + data.error.replaceAll("_", " "));
    return;
  }

  energy = data.energy;
  balance = data.balance;
  updateUI();

  alert(`⚡ +${amount} Energy purchased`);
}

async function claimDailyBonus(btn) {
  const res = await fetch("/api/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  });

  const data = await res.json();
  if (data.error) {
    alert("⏳ Daily bonus already claimed");
    btn.disabled = true;
    btn.style.opacity = 0.5;
    return;
  }

  balance = data.balance;
  energy = data.energy;
  updateUI();

  btn.disabled = true;
  btn.innerText = "🎁 Claimed";
  btn.style.opacity = 0.5;

  alert(`🎉 Daily bonus +${data.reward}`);
}

function requirePro(level = 1) {
  if (proLevel < level) {
    alert("🔒 This feature requires PRO level " + level);
    return false;
  }
  return true;
}

function joinYouTube() {
  tg.openLink("https://www.youtube.com/@Sunusicrypto");

  setTimeout(async () => {
    await fetch("/api/task/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });
    loadUser();
    alert("🎉 YouTube task completed!");
  }, 4000);
}

function joinGroup() {
  tg.openLink("https://t.me/tele_tap_ai");

  setTimeout(async () => {
    await fetch("/api/task/group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });
    loadUser();
    alert("🎉 Community joined!");
  }, 4000);
}

function joinChannel() {
  tg.openLink("https://t.me/TeleAIupdates");

  setTimeout(async () => {
    await fetch("/api/task/channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });
    loadUser();
    alert("🎉 Channel joined!");
  }, 4000);
}

function convertPoints() {
  fetch("/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  })
  .then(r => r.json())
  .then(d => {
    if (d.error) return alert(d.error);
    loadUser();
    alert("✅ Converted successfully");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const lastDaily = localStorage.getItem("lastDailyClaim");
  const today = new Date().toDateString();

  if (lastDaily === today) {
    const btn = document.getElementById("dailyBtn");
    if (btn) {
      btn.disabled = true;
      btn.innerText = "🎁 Claimed";
      btn.style.opacity = 0.5;
    }
  }
});

localStorage.setItem("lastDailyClaim", new Date().toDateString());

function openRoadmap() {
  window.location.href = "/roadmap.html";
}

function openWallet() {
  window.location.href = "/wallet.html";
}

function convertPoints() {
  if (!requirePro(1)) return;
  // continue convert
}

// ================== AGREEMENT ==================
document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("user_agreed")) {
    document.getElementById("agreementModal").style.display = "flex";
  }
});

function acceptAgreement() {
  localStorage.setItem("user_agreed", "yes");
  document.getElementById("agreementModal").style.display = "none";
               }

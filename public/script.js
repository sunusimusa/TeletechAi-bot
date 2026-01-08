// ================== TELEGRAM SAFE INIT ==================
let tg = null;
let TELEGRAM_ID = "guest";

if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe?.user) {
  tg = Telegram.WebApp;
  tg.expand();
  TELEGRAM_ID = String(tg.initDataUnsafe.user.id);
  console.log("✅ Telegram user:", TELEGRAM_ID);
} else {
  console.warn("⚠️ Not opened from Telegram (DEV MODE)");
}

// ================== GLOBAL STATE ==================
let balance = 0;
let energy = 0;
let tokens = 0;
let freeTries = 0;
let referralCode = "";
let referralsCount = 0;

let proLevel = 0;
let isPro = false;
let MAX_ENERGY = 100;

let openingLocked = false; // ✅ SAU DAYA KAWAI
// ================== INIT ==================
document.addEventListener("DOMContentLoaded", async () => {
  showTutorialOnce();
  checkAgreement();
  await loadUser();
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

    proLevel = data.proLevel ?? 0;
    isPro = data.isPro ?? false;
    role = data.role ?? "user";

    MAX_ENERGY = [100,150,200,300][proLevel] || (proLevel >= 4 ? 9999 : 100);

    if (referralCode) {
      document.getElementById("refLink").value =
        `https://t.me/teletechai_bot?start=${referralCode}`;
    }

    updateUI();
  } catch (e) {
    console.error(e);
  }
}

// ================== UI UPDATE ==================
function updateUI() {
  const balanceEl = document.getElementById("balance");
  if (!balanceEl) return;

  balanceEl.innerText = `Balance: ${balance}`;
  document.getElementById("energy").innerText =
    `Energy: ${energy} / ${MAX_ENERGY}`;
  document.getElementById("tokens").innerText = `Tokens: ${tokens}`;
  document.getElementById("refCount").innerText =
    `👥 Referrals: ${referralsCount}`;

  const bar = document.getElementById("energyFill");
  if (bar) {
    bar.style.width =
      Math.min((energy / MAX_ENERGY) * 100, 100) + "%";
  }

  const founderDashboard = document.getElementById("founderDashboard");
  const founderActions = document.getElementById("founderActions");
  const proUpgradeBox = document.getElementById("proUpgradeBox");
  const proBadge = document.getElementById("proBadge");

  if (proLevel >= 4) {
    document.body.classList.add("founder");

    if (proBadge) {
      proBadge.innerText = "👑 FOUNDER";
      proBadge.classList.remove("hidden");
    }

    founderDashboard?.classList.remove("hidden");
    founderActions?.classList.remove("hidden");
    proUpgradeBox?.classList.add("hidden");
    return;
  }

  document.body.classList.remove("founder");
  proBadge?.classList.add("hidden");
  founderDashboard?.classList.add("hidden");
  founderActions?.classList.add("hidden");
  proUpgradeBox?.classList.remove("hidden");
}

// ================== TUTORIAL ==================
function showTutorialOnce() {
  if (!localStorage.getItem("tutorial_seen")) {
    alert(
      "👋 Welcome to TeleTech AI!\n\n" +
      "🎁 Daily Bonus\n⚡ Open Boxes\n👥 Invite Friends\n🚀 Upgrade PRO"
    );
    localStorage.setItem("tutorial_seen", "yes");
  }
}

// ================== DAILY BONUS ==================
async function claimDailyBonus(btn) {
  const res = await fetch("/api/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  });

  const data = await res.json();
  if (data.error) {
    alert("⏳ Already claimed");
    return;
  }

  balance = data.balance;
  energy = data.energy;
  localStorage.setItem("lastDailyClaim", new Date().toDateString());

  btn.disabled = true;
  btn.innerText = "🎁 Claimed";
  btn.style.opacity = 0.5;

  updateUI();
}

// ================== CONVERT ==================
function convertPoints() {
  if (proLevel < 1) {
    alert("🔒 PRO required");
    return;
  }

  fetch("/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  })
  .then(r => r.json())
  .then(d => {
    if (d.error) return alert(d.error);
    loadUser();
  });
}

async function openBox(box) {
  if (!box) return;
  if (openingLocked) return;

  openingLocked = true;
  console.log("📦 Box clicked");

  try {
    const res = await fetch("/api/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error.replaceAll("_", " "));
      openingLocked = false;
      return;
    }

    box.classList.add("opened");

    if (data.reward > 0) {
      box.innerText = `💰 ${data.reward}`;
      if (data.reward >= 200) box.classList.add("rare");
    } else {
      box.innerText = "😢";
    }

    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;
    updateUI();

    setTimeout(() => {
      box.classList.remove("opened", "rare");
      box.innerText = "";
      openingLocked = false;
    }, 1200);

  } catch (err) {
    console.error(err);
    openingLocked = false;
    alert("Network error");
  }
}

function resetAllBoxes() {
  document.querySelectorAll(".box").forEach(b => {
    b.classList.remove("opened", "rare");
    b.innerText = "";
  });
  openedCount = 0;
}

function joinYouTube() {
  tg.openLink("https://www.youtube.com/@Sunusicrypto");

  setTimeout(async () => {
    const res = await fetch("/api/task/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();
    if (data.error) {
      alert(data.error.replaceAll("_", " "));
      return;
    }

    alert("🎉 YouTube task completed +10 TOKEN");
    loadUser();
  }, 4000);
}

function joinGroup() {
  tg.openLink("https://t.me/tele_tap_ai");

  setTimeout(async () => {
    const res = await fetch("/api/task/group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();
    if (data.error) {
      alert(data.error.replaceAll("_", " "));
      return;
    }

    alert("🎉 Community joined +5 TOKEN");
    loadUser();
  }, 4000);
}

function joinChannel() {
  tg.openLink("https://t.me/TeleAIupdates");

  setTimeout(async () => {
    const res = await fetch("/api/task/channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();
    if (data.error) {
      alert(data.error.replaceAll("_", " "));
      return;
    }

    alert("🎉 Channel joined +5 TOKEN");
    loadUser();
  }, 4000);
}

async function upgradePro(level) {
  const res = await fetch("/api/pro/upgrade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: TELEGRAM_ID,
      level
    })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error.replaceAll("_", " "));
    return;
  }

  alert(`🚀 PRO Level ${level} Activated!`);
  loadUser();
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
    alert(data.error.replaceAll("_", " "));
    return;
  }

  energy = data.energy;
  balance = data.balance;
  updateUI();

  alert(`⚡ +${amount} Energy purchased`);
}

function openWallet() {
  window.location.href = "/wallet.html";
}

function openRoadmap() {
  window.location.href = "/roadmap.html";
}

function copyRef() {
  navigator.clipboard.writeText(
    document.getElementById("refLink").value
  );
  alert("👑 Referral link copied!");
}

function renderFounderDashboard() {
  if (proLevel >= 4) {
    const box = document.getElementById("founderDashboard");
    if (box) box.classList.remove("hidden");
  }
}

// ================== FOUNDER ACTIONS ==================
function openFounderStats() {
  alert(
    "📊 GLOBAL STATS\n\n" +
    "• Total Users\n" +
    "• Total Tokens Burned\n" +
    "• System Wallet Balance\n\n" +
    "🚧 Full dashboard coming soon"
  );
}

function openReferralLeaderboard() {
  window.location.href = "/leaderboard.html";
}

function openFounderStats() {
  window.location.href = "/founder-stats.html";
}

// ================== AGREEMENT ==================
function checkAgreement() {
  if (!localStorage.getItem("user_agreed")) {
    document.getElementById("agreementModal").style.display = "flex";
  }
}

function acceptAgreement() {
  localStorage.setItem("user_agreed", "yes");
  document.getElementById("agreementModal").style.display = "none";
}

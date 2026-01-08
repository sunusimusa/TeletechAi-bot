// ================== TELEGRAM ==================
if (!window.Telegram?.WebApp?.initDataUnsafe?.user) {
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

let proLevel = 0;
let isPro = false;
let role = "user";
let MAX_ENERGY = 100;

let openingLocked = false;
let soundEnabled = true;

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
  // 🛡️ Kariya idan page ba shi da stats
  const balanceEl = document.getElementById("balance");
  if (!balanceEl) return;

  // ===== BASIC STATS =====
  balanceEl.innerText = `Balance: ${balance}`;
  document.getElementById("energy").innerText =
    `Energy: ${energy} / ${MAX_ENERGY}`;
  document.getElementById("tokens").innerText = `Tokens: ${tokens}`;
  document.getElementById("refCount").innerText =
    `👥 Referrals: ${referralsCount}`;

  // ===== ENERGY BAR =====
  const bar = document.getElementById("energyFill");
  if (bar) {
    const percent = Math.min((energy / MAX_ENERGY) * 100, 100);
    bar.style.width = percent + "%";
  }

  // ===== ELEMENTS =====
  const founderDashboard = document.getElementById("founderDashboard");
  const founderActions = document.getElementById("founderActions");
  const proUpgradeBox = document.getElementById("proUpgradeBox");
  const proBadge = document.getElementById("proBadge");

  // ===== 👑 FOUNDER MODE (PRO LEVEL 4) =====
  if (proLevel >= 4) {
    document.body.classList.add("founder");

    // 👑 Badge
    if (proBadge) {
      proBadge.innerText = "👑 FOUNDER";
      proBadge.classList.remove("hidden");
    }

    // 👑 Founder panels
    founderDashboard?.classList.remove("hidden");
    founderActions?.classList.remove("hidden");

    // 🚫 Hide upgrade buttons
    proUpgradeBox?.classList.add("hidden");

    return; // 🔴 MUHIMMI – kada ya wuce nan
  }

  // ===== 👤 NORMAL USER MODE =====
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
  // 🛑 idan yana budewa ko an riga an bude
  if (openingLocked || box.classList.contains("opened")) return;

  // 🛑 idan babu energy ko free tries
  if (energy <= 0 && freeTries <= 0) {
    alert("⚡ Not enough energy");
    return;
  }

  openingLocked = true;
  playSound("click");

  try {
    const res = await fetch("/api/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();

    // ❌ ERROR DAGA BACKEND
    if (data.error) {
      alert("❌ " + data.error.replaceAll("_", " "));
      openingLocked = false; // 🔥 MUHIMMI
      return;
    }

    // ✅ OPEN BOX UI
    box.classList.add("opened");

    if (data.reward > 0) {
      box.innerText = `💰 ${data.reward}`;
      playSound("win");

      if (data.reward >= 200) {
        box.classList.add("rare");
      }
    } else {
      box.innerText = "😢";
      playSound("lose");
    }

    // 🔄 UPDATE STATE
    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries ?? freeTries;

    updateUI();

    // ⏱️ Rufe box bayan 1.5s
    setTimeout(() => {
      box.classList.remove("opened", "rare");
      box.innerText = "";
      openingLocked = false; // 🔥 SAKI LOCK
    }, 1500);

  } catch (err) {
    console.error(err);
    alert("❌ Network error");
    openingLocked = false; // 🔥 SAKI LOCK KO DA YAUSHE
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

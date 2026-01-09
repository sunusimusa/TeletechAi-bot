const tg = window.Telegram?.WebApp || null;

let TELEGRAM_ID = "guest";
let REF = null;

document.addEventListener("DOMContentLoaded", () => {
  if (!tg) {
    alert("❌ Open this app from Telegram");
    return;
  }

  tg.ready();
  tg.expand();

  if (tg.initDataUnsafe?.user?.id) {
    TELEGRAM_ID = String(tg.initDataUnsafe.user.id);
  }

  REF =
    tg.initDataUnsafe?.start_param ||
    new URLSearchParams(window.location.search).get("tgWebAppStartParam") ||
    new URLSearchParams(window.location.search).get("ref");

  if (TELEGRAM_ID === "guest") {
    alert("❌ Open this app from Telegram");
    return;
  }

  console.log("✅ Telegram ID:", TELEGRAM_ID);
  console.log("🔗 Referral:", REF);

  loadUser();
});

/* =====================================================
   GLOBAL STATE
===================================================== */
let balance = 0;
let energy = 0;
let tokens = 0;
let freeTries = 0;
let referralsCount = 0;
let referralCode = "";
let proLevel = 0;
let MAX_ENERGY = 100;
let openingLocked = false;

/* =====================================================
   INIT
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  if (TELEGRAM_ID === "guest") {
    alert("❌ Open this app from Telegram");
    return;
  }

  loadUser();
});

/* =====================================================
   LOAD / CREATE USER
===================================================== */
async function loadUser() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegramId: TELEGRAM_ID,
        ref: REF
      })
    });

    const data = await res.json();
    if (data.error) throw data.error;

    balance = data.balance;
    energy = data.energy;
    tokens = data.tokens;
    freeTries = data.freeTries;
    referralsCount = data.referralsCount;
    referralCode = data.referralCode;
    proLevel = data.proLevel;
    MAX_ENERGY = data.maxEnergy;

    updateUI();

    if (referralCode) {
      document.getElementById("refLink").value =
        `https://t.me/teletechai_bot?start=${referralCode}`;
    }

    // ✅ AGREEMENT – ANAN NE MAFI DACE
    checkAgreement();

  } catch (e) {
    console.error(e);
    alert("❌ Failed to load user");
  }
}

/* =====================================================
   UI UPDATE
===================================================== */
function updateUI() {
  document.getElementById("balance").innerText = `Balance: ${balance}`;
  document.getElementById("tokens").innerText = `Tokens: ${tokens}`;
  document.getElementById("freeTries").innerText = `Free tries: ${freeTries}`;
  document.getElementById("refCount").innerText = `👥 Referrals: ${referralsCount}`;
  document.getElementById("energy").innerText =
    `Energy: ${energy} / ${MAX_ENERGY}`;

  const bar = document.getElementById("energyFill");
  if (bar) {
    bar.style.width =
      Math.min((energy / MAX_ENERGY) * 100, 100) + "%";
  }

  // Founder button
  if (proLevel >= 4) {
    document.getElementById("founderActions")?.classList.remove("hidden");
  }
}

/* =====================================================
   OPEN BOX
===================================================== */
async function openBox(box) {
  if (openingLocked) return;
  openingLocked = true;

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

    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;

    box.classList.add("opened");
    box.innerText = data.reward > 0 ? `💰 ${data.reward}` : "😢";

    updateUI();

    setTimeout(() => {
      box.classList.remove("opened");
      box.innerText = "";
      openingLocked = false;
    }, 1200);

  } catch (err) {
    console.error(err);
    openingLocked = false;
    alert("❌ Network error");
  }
}

/* =====================================================
   DAILY BONUS
===================================================== */
async function claimDaily() {
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
  updateUI();

  alert("🎁 Daily bonus claimed!");
}

/* =====================================================
   CONVERT
===================================================== */
async function convertPoints() {
  const res = await fetch("/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  });

  const data = await res.json();
  if (data.error) {
    alert(data.error.replaceAll("_", " "));
    return;
  }

  loadUser();
}

/* =====================================================
   BUY ENERGY
===================================================== */
async function buyEnergy(amount) {
  const res = await fetch("/api/buy-energy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID, amount })
  });

  const data = await res.json();
  if (data.error) {
    alert(data.error.replaceAll("_", " "));
    return;
  }

  balance = data.balance;
  energy = data.energy;
  updateUI();

  alert(`⚡ +${amount} Energy purchased`);
}

/* =====================================================
   NAVIGATION
===================================================== */
function openRoadmap() {
  window.location.href = "/roadmap.html";
}

function openWallet() {
  window.location.href = "/wallet.html";
}

function openLeaderboard() {
  window.location.href = "/leaderboard.html";
}

function openFounderStats() {
  window.location.href = "/founder-stats.html";
}

/* =====================================================
   COPY REF
===================================================== */
function copyRef() {
  navigator.clipboard.writeText(
    document.getElementById("refLink").value
  );
  alert("🔗 Referral link copied!");
}

function joinYouTube() {
  tg.openLink("https://www.youtube.com/@Sunusicrypto"); // 🔁 canza idan kana so

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

async function upgradePro(level = 1) {
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

  balance = data.balance;
  energy = data.energy;
  updateUI();

  alert(`⚡ +${amount} Energy purchased`);
}

async function buyToken(amount = 1) {
  const res = await fetch("/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: TELEGRAM_ID
    })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error.replaceAll("_", " "));
    return;
  }

  balance = data.balance;
  tokens = data.tokens;
  updateUI();

  alert("🪙 Successfully bought 1 TTECH token");
}

async function sellToken(amount = 1) {
  const res = await fetch("/api/sell", {
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

  balance = data.balance;
  tokens = data.tokens;
  updateUI();

  alert("💰 Token sold successfully");
}

async function withdraw() {
  if (!TELEGRAM_ID || TELEGRAM_ID === "guest") {
    alert("❌ Open this app from Telegram");
    return;
  }

  const walletInput = document.getElementById("toWallet");
  const amountInput = document.getElementById("sendAmount");

  const toWallet = walletInput.value.trim();
  const amount = Number(amountInput.value);

  if (!toWallet || !amount || amount <= 0) {
    alert("❌ Enter valid wallet & amount");
    return;
  }

  // 🔒 lock button
  const btn = document.activeElement;
  if (btn) btn.disabled = true;

  try {
    const res = await fetch("/api/wallet/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegramId: TELEGRAM_ID,
        toWallet,
        amount
      })
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error.replaceAll("_", " "));
      return;
    }

    tokens = data.balance;
    updateUI();

    alert(
      `✅ Withdraw successful\n\n` +
      `Sent: ${data.sent}\n` +
      `Gas fee: ${data.gasFee}`
    );

    walletInput.value = "";
    amountInput.value = "";

  } catch (err) {
    console.error(err);
    alert("❌ Network error, try again");
  } finally {
    if (btn) btn.disabled = false;
  }
}

function openRoadmap() {
  if (tg) {
    tg.openLink(location.origin + "/roadmap.html");
  } else {
    window.location.href = "/roadmap.html";
  }
}

function checkAgreement() {
  if (!localStorage.getItem("user_agreed")) {
    document.getElementById("agreementModal").style.display = "flex";
  }
}

function acceptAgreement() {
  localStorage.setItem("user_agreed", "yes");
  document.getElementById("agreementModal").style.display = "none";
}

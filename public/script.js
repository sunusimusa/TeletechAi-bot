/* =====================================================
   CLEAN FINAL FRONTEND (SERVER = SOURCE OF TRUTH)
===================================================== */

/* ================= CONFIG ================= */
const FOUNDER_USER_ID = "SUNUSI_001";

/* ================= USER ID ================= */
let userId = localStorage.getItem("userId");
if (!userId) {
  userId =
    "USER_" +
    Date.now() +
    "_" +
    Math.random().toString(36).substring(2, 6);
  localStorage.setItem("userId", userId);
}

/* ================= STATE (FROM SERVER) ================= */
let wallet = "";
let balance = 0;
let energy = 0;
let tokens = 0;
let freeTries = 0;
let proLevel = 0;
let referralsCount = 0;

let MAX_ENERGY = 100;
let MAX_FREE_TRIES = 3;
let openingLocked = false;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  agreementInit();
  await syncUserFromServer();
});

function playSound(id) {
  const sound = document.getElementById(id);
  if (!sound) return;

  sound.currentTime = 0;
  sound.play().catch(() => {});
}

/* ================= AGREEMENT ================= */
function agreementInit() {
  const modal = document.getElementById("agreementModal");
  const btn = document.getElementById("agreeBtn");
  if (!modal || !btn) return;

  if (localStorage.getItem("agreed") === "yes") {
    modal.classList.add("hidden");
  } else {
    modal.classList.remove("hidden");
  }

  btn.onclick = () => {
    localStorage.setItem("agreed", "yes");
    modal.classList.add("hidden");
  };
}

/* ================= SYNC USER ================= */
async function syncUserFromServer() {
  try {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref"); // referral wallet (optional)

    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ref })
    });

    const data = await res.json();
    if (data.error) {
      console.error("User sync error:", data.error);
      return;
    }

    // SERVER = TRUTH
    wallet = data.wallet;
    balance = data.balance;
    energy = data.energy;
    tokens = data.tokens;
    freeTries = data.freeTries;
    proLevel = data.proLevel;
    referralsCount = data.referralsCount || 0;

    if (data.role === "founder" || userId === FOUNDER_USER_ID) {
      MAX_ENERGY = 9999;
      MAX_FREE_TRIES = 9999;
    } else {
      MAX_ENERGY = 100;
      MAX_FREE_TRIES = 3;
      if (proLevel === 1) MAX_ENERGY = 150;
      if (proLevel === 2) MAX_ENERGY = 200;
      if (proLevel === 3) MAX_ENERGY = 300;
    }

    updateUI();
    fillReferralLink();
  } catch (e) {
    console.error("Sync failed", e);
  }
}

/* ================= UI ================= */
function updateUI() {
  setText("balance", `Balance: ${balance}`);
  setText("tokens", `Tokens: ${tokens}`);
  setText("freeTries", `Free tries: ${freeTries}`);
  setText("energy", `Energy: ${energy} / ${MAX_ENERGY}`);
  setText("refCount", `👥 Referrals: ${referralsCount}`);

  const bar = document.getElementById("energyFill");
  if (bar) {
    bar.style.width =
      Math.min((energy / MAX_ENERGY) * 100, 100) + "%";
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

/* ================= REFERRAL ================= */
function fillReferralLink() {
  const refLink = document.getElementById("refLink");
  if (refLink && wallet) {
    refLink.value = location.origin + "/?ref=" + wallet;
  }
}

function copyRef() {
  const input = document.getElementById("refLink");
  if (!input) return;
  input.select();
  document.execCommand("copy");
  alert("✅ Referral link copied");
}

/* ================= OPEN BOX ================= */
async function openBox(box, type) {
  if (openingLocked || box.classList.contains("opened")) return;
  openingLocked = true;

  // 🔊 click sound (da zarar an taba box)
  playSound("clickSound");

  try {
    const res = await fetch("/api/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, type })
    });

    const data = await res.json();

    if (data.error) {
      // ❌ error sound
      playSound("errorSound");
      alert("❌ " + data.error);
      openingLocked = false;
      return;
    }

    // 🔄 update from server
    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;

    const rewardEl = box.querySelector(".reward");
    box.classList.add("opened");

    if (data.reward > 0) {
      // 🎉 win sound
      playSound("winSound");
      rewardEl.textContent = `💰 +${data.reward}`;
    } else {
      // 😢 lose sound
      playSound("loseSound");
      rewardEl.textContent = "😢 Empty";
    }

    rewardEl.classList.remove("hidden");
    updateUI();

    setTimeout(() => {
      box.classList.remove("opened");
      rewardEl.classList.add("hidden");
      rewardEl.textContent = "";
      openingLocked = false;
    }, 1500);

  } catch (e) {
    console.error(e);
    playSound("errorSound");
    openingLocked = false;
  }
}

/* ================= ADS ================= */
let adTimer = null;

async function watchAd() {
  const btn = document.getElementById("watchAdBtn");
  const status = document.getElementById("adStatus");

  if (!btn || !status) return;

  btn.disabled = true;
  let timeLeft = 30;
  status.classList.remove("hidden");
  status.innerText = `⏳ Watching ad... ${timeLeft}s`;

  adTimer = setInterval(() => {
    timeLeft--;
    status.innerText = `⏳ Watching ad... ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(adTimer);
      claimAdReward(btn, status);
    }
  }, 1000);
}

async function claimAdReward(btn, status) {
  try {
    const res = await fetch("/api/ads/watch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();
    if (data.error) {
      status.innerText = "❌ " + data.error;
    } else {
      energy = data.energy;
      balance = data.balance;
      updateUI();
      status.innerText = "✅ Reward added!";
    }
  } catch (e) {
    status.innerText = "❌ Error";
  }

  setTimeout(() => {
    status.classList.add("hidden");
    btn.disabled = false;
  }, 2000);
}

async function buyEnergy(amount) {
  try {
    const res = await fetch("/api/energy/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount })
    });

    const data = await res.json();
    if (data.error) return alert("❌ " + data.error);

    energy = data.energy;
    balance = data.balance;
    updateUI();
  } catch (e) {
    alert("Network error");
  }
}

async function convertPoints() {
  if (balance < 10000) return alert("❌ Not enough balance");

  const res = await fetch("/api/token/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount: 1 })
  });

  const data = await res.json();
  if (data.error) return alert("❌ " + data.error);

  balance = data.balance;
  tokens = data.tokens;
  updateUI();
}

function buyToken() {
  convertPoints();
}

async function sellToken() {
  const res = await fetch("/api/token/sell", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount: 1 })
  });

  const data = await res.json();
  if (data.error) return alert("❌ " + data.error);

  balance = data.balance;
  tokens = data.tokens;
  updateUI();
}

async function upgradePro(level) {
  const cost = level === 1 ? 5 : level === 2 ? 10 : 20;

  if (tokens < cost) return alert("❌ Not enough tokens");

  const res = await fetch("/api/pro/upgrade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, level })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  proLevel = data.proLevel;
  energy = data.energy;
  updateUI();
}


/* ================= NAV ================= */
function openWallet() {
  location.href = "/wallet.html";
}

function openFounderStats() {
  location.href = "/founder-stats.html";
}

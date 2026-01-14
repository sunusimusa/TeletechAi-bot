/* =====================================================
   CLEAN FINAL FRONTEND
   SERVER = SOURCE OF TRUTH
===================================================== */

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
let openingLocked = false;
let adWatched = false;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  agreementInit();
  handleOffline();
  await syncUserFromServer();
});

/* ================= SOUND ================= */
function playSound(id) {
  const sound = document.getElementById(id);
  if (!sound) return;
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

// 🔓 unlock audio (Android / Play Store)
document.addEventListener(
  "click",
  () => {
    ["clickSound", "winSound", "loseSound", "errorSound"].forEach(id => {
      const s = document.getElementById(id);
      if (s) s.play().then(() => s.pause()).catch(() => {});
    });
  },
  { once: true }
);

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

function linkTelegram() {
  const botUsername = "TeleTechAiBot"; // naka
  const url = `https://t.me/${botUsername}?start=${userId}`;
  window.open(url, "_blank");
}

function handleOffline() {
  if (!navigator.onLine) {
    document.body.classList.add("offline");
  } else {
    document.body.classList.remove("offline");
  }
}

window.addEventListener("online", handleOffline);
window.addEventListener("offline", handleOffline);
handleOffline();

function isOffline() {
  return !navigator.onLine;
}

window.addEventListener("offline", showOffline);
window.addEventListener("online", hideOffline);

function showOffline() {
  const msg = document.getElementById("offlineMsg");
  if (msg) msg.classList.remove("hidden");

  disableGame(true);
}

function hideOffline() {
  const msg = document.getElementById("offlineMsg");
  if (msg) msg.classList.add("hidden");

  disableGame(false);
}

function disableGame(state) {
  document.querySelectorAll("button").forEach(btn => {
    if (!btn.dataset.allowOffline) {
      btn.disabled = state;
    }
  });
}

/* ================= SYNC USER ================= */
async function syncUserFromServer() {
  try {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");

    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ref })
    });

    const data = await res.json();
    if (!data.success) return;

    wallet = data.wallet;
    balance = data.balance;
    energy = data.energy;
    tokens = data.tokens;
    freeTries = data.freeTries;
    proLevel = data.proLevel;
    referralsCount = data.referralsCount || 0;

    // limits from role / pro
    MAX_ENERGY = data.role === "founder" ? 9999 : 100;
    if (proLevel === 1) MAX_ENERGY = 150;
    if (proLevel === 2) MAX_ENERGY = 200;
    if (proLevel === 3) MAX_ENERGY = 300;

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

  // ⛔ idan babu internet
  if (!navigator.onLine) {
    alert("📡 Don Allah ka kunna internet");
    return;
  }
  if (openingLocked || box.classList.contains("opened")) return;
  openingLocked = true;

  playSound("clickSound");

  try {
    const res = await fetch("/api/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, type })
    });

    const data = await res.json();
    if (data.error) {
  playSound("errorSound");

  if (data.error !== "TOO_FAST") {
    alert("❌ " + data.error);
  }

  openingLocked = false;
  return;
    }

    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;

    const rewardEl = box.querySelector(".reward");
    box.classList.add("opened");

    if (data.reward > 0) {
      playSound("winSound");
      rewardEl.textContent = `+${data.reward}`;
    } else {
      playSound("loseSound");
      rewardEl.textContent = "Empty";
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
    playSound("errorSound");
    openingLocked = false;
  }
}

/* ================= ADS ================= */
async function watchAd() {

  // ⛔ idan babu internet
  if (!navigator.onLine) {
    alert("📡 Internet ake bukata don Ads");
    return;
  }
  const btn = document.getElementById("watchAdBtn");
  const status = document.getElementById("adStatus");
  if (!btn || !status) return;

  btn.disabled = true;
  adWatched = false;

  let t = 30;
  status.classList.remove("hidden");
  status.innerText = `⏳ Watching ad... ${t}s`;

  const timer = setInterval(() => {
    t--;
    status.innerText = `⏳ Watching ad... ${t}s`;

    if (t <= 0) {
      clearInterval(timer);
      adWatched = true; // ✅ tabbatar an kammala
      claimAdReward(btn, status);
    }
  }, 1000);
}

async function claimAdReward(btn, status) {
  if (!adWatched) {
    status.innerText = "❌ Watch the ad first";
    btn.disabled = false;
    return;
  }

  try {
    const res = await fetch("/api/ads/watch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    if (!res.ok) {
      status.innerText = "📡 Server not reachable";
      return;
    }

    const data = await res.json();

    if (data.error) {
      if (data.error === "WAIT_30_SECONDS") {
        status.innerText = "⏳ Please wait before next ad";
      } else if (data.error === "USER_NOT_FOUND") {
        status.innerText = "⚠️ Reload app";
      } else {
        status.innerText = "❌ Action not allowed";
      }
      return;
    }

    // ✅ SUCCESS
    energy = data.energy;
    balance = data.balance;
    updateUI();
    status.innerText = "✅ Reward added!";
  } catch (e) {
    status.innerText = "📡 No internet connection";
  } finally {
    adWatched = false;
    setTimeout(() => {
      status.classList.add("hidden");
      btn.disabled = false;
    }, 2000);
  }
}

async function convertBalance() {
  const amount = 10000;

  const res = await fetch("/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount })
  });

  const data = await res.json();

  if (data.error) {
    alert("❌ " + data.error);
    return;
  }

  balance = data.balance;
  tokens = data.tokens;
  updateUI();

  alert("✅ Converted successfully!");
}

/* ================= NAV ================= */
function openWallet() {
  location.href = "/wallet.html";
}

function openFounderStats() {
  location.href = "/founder-stats.html";
}

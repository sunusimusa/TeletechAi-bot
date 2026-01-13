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

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  agreementInit();
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
  const btn = document.getElementById("watchAdBtn");
  const status = document.getElementById("adStatus");
  if (!btn || !status) return;

  btn.disabled = true;
  let t = 30;
  status.classList.remove("hidden");
  status.innerText = `⏳ Watching ad... ${t}s`;

  const timer = setInterval(() => {
    t--;
    status.innerText = `⏳ Watching ad... ${t}s`;
    if (t <= 0) {
      clearInterval(timer);
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
      status.innerText =
        data.error === "WAIT_30_SECONDS"
          ? "⏳ Please wait before watching again"
          : "❌ " + data.error;
    } else {
      energy = data.energy;
      balance = data.balance;
      updateUI();
      status.innerText = "✅ Reward added!";
    }
  } catch (e) {
    status.innerText = "❌ Network error";
  }

  setTimeout(() => {
    status.classList.add("hidden");
    btn.disabled = false;
  }, 2000);
}

/* ================= NAV ================= */
function openWallet() {
  location.href = "/wallet.html";
}

function openFounderStats() {
  location.href = "/founder-stats.html";
}

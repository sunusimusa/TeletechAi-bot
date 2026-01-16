/* =====================================================
   LUCKY BOX – FINAL CLEAN INDEX.JS
   SERVER = SOURCE OF TRUTH
   NO localStorage
===================================================== */

/* ================= GLOBAL STATE ================= */
let USER_ID = null;

let wallet = "";
let balance = 0;
let energy = 0;
let tokens = 0;
let freeTries = 0;
let proLevel = 0;
let role = "user";
let MAX_ENERGY = 100;

let openingLocked = false;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  handleOffline();
  await syncUser();
});

/* ================= OFFLINE ================= */
function handleOffline() {
  document.body.classList.toggle("offline", !navigator.onLine);
}
window.addEventListener("online", handleOffline);
window.addEventListener("offline", handleOffline);

/* ================= SYNC USER (CORE) ================= */
async function syncUser() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (!data.success) return;

    USER_ID = data.userId; // ✅ yanzu ba null ba

    wallet = data.wallet;
    balance = data.balance;
    energy = data.energy;
    tokens = data.tokens;
    freeTries = data.freeTries;
    proLevel = data.proLevel;
    role = data.role;

    MAX_ENERGY =
      proLevel >= 4 ? 999 :
      proLevel >= 3 ? 300 :
      proLevel >= 2 ? 200 :
      proLevel >= 1 ? 150 : 100;

    updateUI();
    fillReferralLink(); // ✅ KIRA ANAN KAWAI

  } catch (e) {
    console.error("SYNC ERROR", e);
  }
}
/* ================= UI ================= */
function updateUI() {
  setText("balance", `Balance: ${balance}`);
  setText("tokens", `Tokens: ${tokens}`);
  setText("freeTries", `Free tries: ${freeTries}`);
  setText("energy", `Energy: ${energy} / ${MAX_ENERGY}`);

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

/* ================= GAME ACTIONS (LOGIC ONLY) ================= */
async function openBox(type) {
  if (!navigator.onLine || openingLocked) return;
  openingLocked = true;

  try {
    const res = await fetch("/api/open", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type })
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    // server ne kawai yake canza state
    await syncUser();
    return data.reward; // 👈 don animation
  } finally {
    openingLocked = false;
  }
}

async function dailyBonus() {
  try {
    const res = await fetch("/api/daily", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();

    if (data.error) {
      if (data.error === "COME_BACK_TOMORROW") {
        alert("⏳ Ka riga ka karɓa yau. Ka dawo gobe.");
      } else {
        alert("❌ " + data.error);
      }
      return;
    }

    balance = data.balance;
    energy = data.energy;
    MAX_ENERGY = data.maxEnergy;

    updateUI();

    alert(`🎁 Daily Bonus!
+${data.rewardBalance} Balance
+${data.rewardEnergy} Energy`);

  } catch {
    alert("❌ Network error");
  }
}

async function watchAd() {
  const res = await fetch("/api/ads/watch", {
    method: "POST",
    credentials: "include"
  });
  const data = await res.json();
  if (data.error) return alert(data.error);

  await syncUser();
}

async function convertBalance() {
  const res = await fetch("/api/convert", {
    method: "POST",
    credentials: "include"
  });
  const data = await res.json();
  if (data.error) return alert(data.error);

  await syncUser();
}

/* ================= NAV ================= */
function openWallet() {
  location.href = "/wallet.html";
}
function openFounderStats() {
  location.href = "/founder-stats.html";
         }

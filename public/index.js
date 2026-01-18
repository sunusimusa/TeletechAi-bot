/* =====================================================
   INDEX.JS – FINAL GLOBAL USER FLOW (CLEAN)
   RENDER + ANDROID WEBVIEW SAFE
===================================================== */

let USER = null;
let opening = false;

let INIT_TRIES = 0;
const MAX_INIT_TRIES = 5;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  initUser();
});

/* ================= DAILY BUTTON ================= */
function setDailyButtonDisabled(disabled, text) {
  const btn = document.getElementById("dailyBtn");
  if (!btn) return;

  btn.disabled = disabled;

  if (disabled) {
    btn.classList.add("disabled");
    btn.innerText = text || "🎁 Daily Claimed";
  } else {
    btn.classList.remove("disabled");
    btn.innerText = "🎁 Daily Free Energy";
  }
}

/* ================= USER INIT ================= */
async function initUser() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (!data || !data.success) throw new Error("INIT_FAILED");

    USER = data;
    console.log("✅ User initialized:", USER.userId);

    // 🔒 DAILY STATUS
    if (data.dailyClaimed === true) {
      setDailyButtonDisabled(true, "🎁 Come back tomorrow");
    } else {
      setDailyButtonDisabled(false);
    }

    hideStatus();
    updateUI();

  } catch (err) {
    INIT_TRIES++;
    console.warn("⏳ Waiting for session...", INIT_TRIES);

    if (INIT_TRIES < MAX_INIT_TRIES) {
      setTimeout(initUser, 1000);
    } else {
      showStatus("❌ Unable to initialize user. Reload app.");
    }
  }
}

/* ================= UI ================= */
function updateUI() {
  if (!USER) return;

  const bal = document.getElementById("balance");
  const en  = document.getElementById("energy");
  const bar = document.getElementById("energyFill");

  if (bal) bal.innerText = `Balance: ${USER.balance}`;
  if (en)  en.innerText  = `Energy: ${USER.energy}`;

  if (bar) {
    const percent = Math.min(USER.energy * 10, 100);
    bar.style.width = percent + "%";
  }
}

/* ================= STATUS ================= */
function showStatus(text) {
  const el = document.getElementById("statusMsg");
  if (!el) return;
  el.innerText = text;
  el.classList.remove("hidden");
}

function hideStatus() {
  const el = document.getElementById("statusMsg");
  if (!el) return;
  el.classList.add("hidden");
}

/* ================= WATCH AD (ENERGY ONLY) ================= */
async function watchAd() {
  if (!USER) {
    showStatus("⏳ Initializing user...");
    return;
  }

  showStatus("⏳ Watching ad...");

  try {
    const res = await fetch("/api/ads/watch", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) {
      showStatus("❌ " + data.error);
      return;
    }

    USER.energy = data.energy;
    updateUI();
    showStatus("✅ Energy added!");

  } catch (err) {
    console.error("WATCH AD ERROR:", err);
    showStatus("❌ Network error");
  }
}

/* ================= DAILY ENERGY ================= */
async function claimDailyEnergy() {
  if (!USER) {
    showStatus("⏳ Initializing user...");
    return;
  }

  setDailyButtonDisabled(true, "⏳ Claiming...");
  showStatus("🎁 Claiming daily energy...");

  try {
    const res = await fetch("/api/daily-energy", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();

    if (data.error === "DAILY_ALREADY_CLAIMED") {
      showStatus("❌ Daily bonus already claimed. Come back tomorrow 🎁");
      setDailyButtonDisabled(true, "🎁 Come back tomorrow");
      return;
    }

    if (data.error) {
      showStatus("❌ " + data.error);
      setDailyButtonDisabled(false);
      return;
    }

    USER.energy = data.energy;
    updateUI();

    showStatus(`⚡ +${data.added} Daily Energy!`);
    setDailyButtonDisabled(true, "🎁 Come back tomorrow");

  } catch (err) {
    console.error("DAILY ENERGY ERROR:", err);
    showStatus("❌ Network error");
    setDailyButtonDisabled(false);
  }
}

/* ================= OPEN BOX ================= */
async function openBox(boxEl) {
  if (!USER) {
    showStatus("⏳ Initializing...");
    return;
  }

  // 🛑 BLOCK IF NO ENERGY & NO FREE
  if (USER.freeTries <= 0 && USER.energy < 10) {
    showStatus("⚡ Watch ads to get energy");
    return;
  }

  if (opening) return;
  opening = true;

  try {
    const res = await fetch("/api/open", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) {
      showStatus("❌ " + data.error);
      return;
    }

    // 🔄 UPDATE USER STATE
    USER.balance   = data.balance;
    USER.energy    = data.energy;
    USER.freeTries = data.freeTries;

    // 📝 STATUS MESSAGE
    if (data.usedFree === true) {
      showStatus(`🎁 Free Open Used (${USER.freeTries} left)`);
    } else {
      showStatus("⚡ Energy used (-10)");
    }

    // 🎬 ANIMATION
    if (typeof animateBox === "function") {
      animateBox(boxEl, data.reward);
    }

    setTimeout(updateUI, 600);

  } catch (err) {
    console.error("OPEN BOX ERROR:", err);
    showStatus("❌ Network error");
  } finally {
    opening = false;
  }
}

/* ================= SCRATCH ================= */
let SCRATCH_UNLOCKED = false;

async function unlockScratchByAd() {
  showStatus("📺 Watching ad...");

  try {
    const res = await fetch("/api/ads/watch", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) {
      showStatus("❌ " + data.error);
      return;
    }

    SCRATCH_UNLOCKED = true;

    const lock = document.getElementById("scratchLock");
    const card = document.getElementById("scratchCard");

    if (lock) lock.classList.add("hidden");
    if (card) card.classList.remove("hidden");

    USER.energy = data.energy;
    updateUI();

    showStatus("🎟️ Scratch unlocked!");

  } catch (err) {
    showStatus("❌ Network error");
  }
}

async function claimScratchReward() {
  if (!SCRATCH_UNLOCKED) {
    showStatus("📺 Watch ad to unlock scratch");
    return;
  }

  showStatus("🎁 Checking reward...");

  try {
    const res = await fetch("/api/scratch", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();

    if (data.error) {
      showStatus("❌ " + data.error);
      return;
    }

    USER.balance = data.balance;
    USER.energy  = data.energy;

    SCRATCH_UNLOCKED = false;
    updateUI();

    showStatus(
      `🎉 +${data.reward.points} points, ⚡ +${data.reward.energy} energy`
    );

  } catch (err) {
    showStatus("❌ Network error");
  }
  }

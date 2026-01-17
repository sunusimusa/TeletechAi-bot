/* =====================================================
   TASKS & ADS – GLOBAL SAFE SCRIPT
   FILE: public/tasks.js
   STABLE FOR RENDER + WEBVIEW
===================================================== */

let USER = null;
let INIT_TRIES = 0;
const MAX_INIT_TRIES = 5;

/* ================= GLOBAL USER INIT ================= */
async function initUser() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error("NO_USER");
    }

    USER = data;
    console.log("✅ User initialized (tasks)");

    return true;

  } catch (err) {
    INIT_TRIES++;
    console.warn("⏳ Waiting for user session...", INIT_TRIES);

    if (INIT_TRIES < MAX_INIT_TRIES) {
      // 🔁 retry bayan 1s
      setTimeout(initUser, 1000);
    } else {
      showStatus("❌ Unable to initialize user. Reload app.");
    }

    return false;
  }
}

/* ================= DOM READY ================= */
document.addEventListener("DOMContentLoaded", () => {
  initUser();
});

/* ================= HELPERS ================= */
function showStatus(text) {
  const el = document.getElementById("adStatus");
  if (!el) return;
  el.classList.remove("hidden");
  el.innerText = text;
}

/* ================= WATCH AD ================= */
async function watchAd() {
  if (!USER) {
    showStatus("⏳ Initializing user, please wait...");
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

    // 🔄 sabunta USER state
    USER.energy = data.energy ?? USER.energy;

    showStatus("✅ Energy added!");

  } catch (err) {
    console.error("WATCH AD ERROR:", err);
    showStatus("❌ Network error");
  }
}

/* ================= YOUTUBE TASK ================= */
function openYouTube() {
  window.open("https://youtube.com/@Sunusicrypto", "_blank");
}

async function claimYouTubeReward() {
  if (!USER) {
    showStatus("⏳ Initializing user...");
    return;
  }

  try {
    const res = await fetch("/api/task/youtube", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();

    if (data.error) {
      showStatus("❌ " + data.error);
      return;
    }

    USER.balance = data.balance ?? USER.balance;
    showStatus("✅ +300 Balance added!");

  } catch (err) {
    console.error("YOUTUBE TASK ERROR:", err);
    showStatus("❌ Network error");
  }
}

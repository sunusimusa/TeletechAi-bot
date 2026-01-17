/* =====================================================
   INDEX.JS – GLOBAL SAFE USER FLOW
   STABLE FOR RENDER + ANDROID WEBVIEW
===================================================== */

let USER = null;
let opening = false;

let INIT_TRIES = 0;
const MAX_INIT_TRIES = 5;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  initUser();
});

/* ================= USER INIT (SAFE) ================= */
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
    console.log("✅ User initialized");

    updateUI();

  } catch (err) {
    INIT_TRIES++;
    console.warn("⏳ Waiting for session...", INIT_TRIES);

    if (INIT_TRIES < MAX_INIT_TRIES) {
      setTimeout(initUser, 1000); // 🔁 jira cookie
    } else {
      showStatus("❌ Unable to initialize user. Reload app.");
    }
  }
}

/* ================= UI ================= */
function updateUI() {
  if (!USER) return;

  const bal = document.getElementById("balance");
  const en = document.getElementById("energy");
  const bar = document.getElementById("energyFill");

  if (bal) bal.innerText = `Balance: ${USER.balance}`;
  if (en) en.innerText = `Energy: ${USER.energy}`;

  if (bar) {
    bar.style.width = Math.min(USER.energy * 10, 100) + "%";
  }
}

function showStatus(text) {
  const el = document.getElementById("statusMsg");
  if (!el) return;
  el.classList.remove("hidden");
  el.innerText = text;
}

/* ================= WATCH AD ================= */
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

/* ================= OPEN BOX ================= */
async function openBox(boxEl) {
  if (!USER) {
    showStatus("⏳ Initializing user...");
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

    USER.balance = data.balance;
    USER.energy = data.energy;

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

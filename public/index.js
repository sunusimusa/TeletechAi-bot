let balance = 0;
let energy = 0;
let opening = false;
let USER = null;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (!data.success) throw "INIT_FAILED";

    USER = data; // 🔑 MUHIMMI

    updateUI();

  } catch {
    alert("❌ User not initialized");
  }
}

function updateUI() {
  document.getElementById("balance").innerText =
    "Balance: " + USER.balance;

  document.getElementById("energy").innerText =
    "Energy: " + USER.energy;
}

function handleOffline() {
  const msg = document.getElementById("offlineMsg");
  if (!msg) return;
  msg.classList.toggle("hidden", navigator.onLine);
}
window.addEventListener("online", handleOffline);
window.addEventListener("offline", handleOffline);

/* ================= SYNC USER ================= */
async function syncUser() {
  const res = await fetch("/api/user", {
    method: "POST",
    credentials: "include"
  });
  const data = await res.json();
  if (!data.success) return;

  balance = data.balance;
  energy = data.energy;
  updateUI();
}

/* ================= OPEN BOX ================= */
async function openBox(boxEl) {
  if (opening) return;
  opening = true;

  try {
    const res = await fetch("/api/open", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) {
      alert(data.error);
      return;
    }

    balance = data.balance;
    energy = data.energy;

    if (typeof animateBox === "function") {
      animateBox(boxEl, data.reward);
    }

    setTimeout(updateUI, 600);

  } catch {
    alert("Network error");
  } finally {
    opening = false;
  }
}

/* ================= WATCH AD ================= */
async function watchAd() {
  if (!USER) {
    alert("User not initialized");
    return;
  }

  const res = await fetch("/api/ads/watch", {
    method: "POST",
    credentials: "include"
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  USER.energy = data.energy;
  updateUI();
}

/* ================= UI ================= */
function updateUI() {
  document.getElementById("balance").innerText = `Balance: ${balance}`;
  document.getElementById("energy").innerText = `Energy: ${energy}`;

  const bar = document.getElementById("energyFill");
  if (bar) {
    bar.style.width = Math.min(energy * 10, 100) + "%";
  }
}

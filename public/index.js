/* =====================================================
   INDEX.JS – GAME LOGIC ONLY
===================================================== */

let balance = 0;
let energy = 0;
let opening = false;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();

    // ❗ idan babu session, sake init
    if (!data.success) {
      await fetch("/api/user", {
        method: "POST",
        credentials: "include"
      });
      return init();
    }

    balance = data.balance;
    energy = data.energy;

    updateUI();

  } catch {
    // ❌ kar a nuna error ga user
    console.log("Re-initializing user…");
  }
}

/* ================= OFFLINE ================= */
function handleOffline() {
  const msg = document.getElementById("offlineMsg");
  if (!msg) return;
  msg.classList.toggle("hidden", navigator.onLine);
}
window.addEventListener("online", handleOffline);
window.addEventListener("offline", handleOffline);

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

    // 🎁 UI animation (script.js)
    if (typeof animateBox === "function") {
      animateBox(boxEl, data.reward);
    }

    setTimeout(updateUI, 600);

  } catch {
    alert("❌ Network error");
  } finally {
    opening = false;
  }
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

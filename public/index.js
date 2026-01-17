/* ================= GLOBAL STATE ================= */
let balance = 0;
let energy = 0;
let freeTries = 0;
let MAX_ENERGY = 100;
let openingLocked = false;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", syncUser);

/* ================= SYNC ================= */
async function syncUser() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (!data.success) return;

    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;
    MAX_ENERGY = data.maxEnergy;

    updateUI();
  } catch (e) {
    alert("❌ Network error");
  }
}

/* ================= UI ================= */
function updateUI() {
  setText("balance", `Balance: ${balance}`);
  setText("freeTries", `Free tries: ${freeTries}`);
  setText("energy", `Energy: ${energy} / ${MAX_ENERGY}`);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

/* ================= OPEN BOX ================= */
async function openBox(type, boxEl) {
  if (!navigator.onLine) return alert("📡 Internet required");
  if (openingLocked) return;

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

    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;

    if (boxEl) animateBox(boxEl, data.reward);

    setTimeout(updateUI, 600);

  } catch {
    alert("❌ Network error");
  } finally {
    openingLocked = false;
  }
}

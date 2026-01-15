/* =====================================================
   DAILY BONUS + AUTO ENERGY – FINAL CLEAN
   SERVER = SOURCE OF TRUTH
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadUser();
});

/* ================= LOAD USER ================= */
async function loadUser() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (!data.success) return deny();

    showApp();
    render(data);

  } catch {
    deny();
  }
}

/* ================= RENDER ================= */
function render(data) {
  const maxEnergy =
    data.proLevel >= 4 ? 999 :
    data.proLevel >= 3 ? 300 :
    data.proLevel >= 2 ? 200 :
    data.proLevel >= 1 ? 150 : 100;

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energyText").innerText =
    `${data.energy} / ${maxEnergy}`;

  const bar = document.getElementById("energyFill");
  bar.style.width = Math.min((data.energy / maxEnergy) * 100, 100) + "%";
}

/* ================= DAILY ================= */
async function claimDaily() {
  const btn = document.getElementById("dailyBtn");
  const msg = document.getElementById("dailyMsg");

  btn.disabled = true;
  msg.innerText = "⏳ Claiming...";

  try {
    const res = await fetch("/api/daily", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();

    if (!data.success) {
      msg.innerText =
        data.error === "COME_BACK_TOMORROW"
          ? "⏰ Already claimed today"
          : "❌ Failed";
      btn.disabled = false;
      return;
    }

    msg.innerText =
      `✅ +${data.rewardBalance} 💰 +${data.rewardEnergy} ⚡`;

    render(data);

  } catch {
    msg.innerText = "❌ Network error";
  } finally {
    btn.disabled = false;
  }
}

/* ================= HELPERS ================= */
function deny() {
  document.getElementById("denied").classList.remove("hidden");
}

function showApp() {
  document.getElementById("app").classList.remove("hidden");
}

function back() {
  location.href = "/";
}

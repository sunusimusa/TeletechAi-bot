/* =====================================================
   FOUNDER STATS – FINAL CLEAN
   SERVER = SOURCE OF TRUTH
   NO localStorage
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadFounderStats();
});

/* ================= LOAD STATS ================= */
async function loadFounderStats() {
  try {
    const res = await fetch("/api/founder/stats", {
      credentials: "include" // 🍪 session cookie
    });

    const data = await res.json();

    if (!data.success) {
      deny();
      return;
    }

    showApp();

    set("totalUsers", data.totalUsers);
    set("proUsers", data.proUsers);
    set("totalBalance", data.totalBalance);
    set("totalTokens", data.totalTokens);
    set("totalEnergy", data.totalEnergy);
    set("totalReferrals", data.totalReferrals);

  } catch (e) {
    deny();
  }
}

/* ================= HELPERS ================= */
function deny() {
  document.getElementById("denied").classList.remove("hidden");
}

function showApp() {
  document.getElementById("app").classList.remove("hidden");
}

function set(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value ?? 0;
}

function backToGame() {
  location.href = "/";
}

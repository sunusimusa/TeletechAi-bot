/* =====================================================
   FOUNDER STATS – NO LOGIN (SERVER PROTECTED)
===================================================== */

const userId = localStorage.getItem("userId");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadStats();
});

/* ================= LOAD STATS ================= */
async function loadStats() {
  if (!userId) {
    showDenied();
    return;
  }

  try {
    const res = await fetch(`/api/founder/stats?userId=${userId}`);
    const data = await res.json();

    if (data.error) {
      showDenied();
      return;
    }

    // ✅ show dashboard
    document.getElementById("app").style.display = "block";

    setText("totalUsers", data.totalUsers);
    setText("totalBalance", data.totalBalance);
    setText("totalTokens", data.totalTokens);
    setText("totalEnergy", data.totalEnergy);
    setText("totalReferrals", data.totalReferrals);

  } catch (e) {
    alert("❌ Failed to load founder stats");
  }
}

/* ================= HELPERS ================= */
function showDenied() {
  const denied = document.getElementById("denied");
  const app = document.getElementById("app");

  if (app) app.style.display = "none";
  if (denied) denied.style.display = "block";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value ?? 0;
}

/* ================= NAV ================= */
function backToGame() {
  window.location.href = "/";
}

/* =====================================================
   FOUNDER STATS – FINAL CLEAN
   SERVER = SOURCE OF TRUTH
===================================================== */

const userId = localStorage.getItem("userId");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  verifyFounder();
});

/* ================= VERIFY FOUNDER ================= */
async function verifyFounder() {
  if (!userId) return denyAccess();

  try {
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();

    if (!data.success || data.role !== "founder") {
      return denyAccess();
    }

    // ✅ founder confirmed
    loadStats();

  } catch (e) {
    denyAccess();
  }
}

/* ================= LOAD STATS ================= */
async function loadStats() {
  try {
    const res = await fetch(`/api/founder/stats?userId=${userId}`);
    const data = await res.json();

    if (data.error) return denyAccess();

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
function denyAccess() {
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

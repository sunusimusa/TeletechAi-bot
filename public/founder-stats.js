/* =====================================================
   FOUNDER STATS – CLEAN & SAFE
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
    document.getElementById("app").style.display = "block";
    loadStats();

  } catch (e) {
    denyAccess();
  }
}

/* ================= LOAD STATS ================= */
async function loadStats() {
  try {
    const res = await fetch("/api/founder/stats");
    const data = await res.json();

    setText("totalUsers", data.totalUsers);
    setText("proUsers", data.proUsers);
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
  if (denied) denied.style.display = "block";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value ?? 0;
}

/* ================= NAV ================= */
function backToGame() {
  location.href = "/";
}

/* ================= FOUNDER GUARD (SIMPLE) ================= */
const USER_ID = localStorage.getItem("userId");

if (USER_ID !== "SUNUSI_001") {
  alert("❌ Access denied");
  location.href = "/";
}

/* ================= LOAD STATS ================= */
document.addEventListener("DOMContentLoaded", loadStats);

async function loadStats() {
  try {
    const res = await fetch("/api/founder/stats");
    const data = await res.json();

    setStat("totalUsers", data.totalUsers || 0);
    setStat("proUsers", data.proUsers || 0);
    setStat("founders", data.founders || 0);
    setStat("totalBalance", data.totalBalance || 0);
    setStat("totalTokens", data.totalTokens || 0);
    setStat("totalEnergy", data.totalEnergy || 0);
    setStat("totalReferrals", data.totalReferrals || 0);

    animateCards();

  } catch (err) {
    console.error(err);
    alert("❌ Failed to load stats");
  }
}

/* ================= UI HELPERS ================= */
function setStat(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function animateCards() {
  const cards = document.querySelectorAll(".founder-card");
  cards.forEach((card, i) => {
    setTimeout(() => {
      card.classList.add("enter");
    }, i * 120);
  });
}

function goBack() {
  location.href = "/";
}

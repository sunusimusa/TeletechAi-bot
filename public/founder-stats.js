/* ================= CONFIG ================= */
const USER_ID = localStorage.getItem("userId") || "SUNUSI_001";

/* ================= LOAD STATS ================= */
document.addEventListener("DOMContentLoaded", loadStats);

async function loadStats() {
  try {
    const res = await fetch(`/api/founder/stats?userId=${USER_ID}`);
    const data = await res.json();

    if (!data.success) {
      alert("❌ Access denied");
      return;
    }

    setStat("totalUsers", data.totalUsers);
    setStat("proUsers", data.proUsers);
    setStat("founders", data.founders);
    setStat("totalBalance", data.totalBalance);
    setStat("totalTokens", data.totalTokens);
    setStat("totalEnergy", data.totalEnergy);
    setStat("totalReferrals", data.totalReferrals);

    animateCards();

  } catch (err) {
    console.error(err);
    alert("❌ Failed to load stats");
  }
}

/* ================= UI HELPERS ================= */
function setStat(id, value) {
  document.getElementById(id).innerText = value;
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

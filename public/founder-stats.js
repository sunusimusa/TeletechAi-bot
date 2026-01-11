/* ================= LOAD STATS ================= */
document.addEventListener("DOMContentLoaded", loadStats);

async function loadStats() {
  try {
    // 🔐 Babu userId – session ne ke tantance founder
    const res = await fetch("/api/founder/stats", {
      credentials: "include" // MUHIMMI 👑
    });

    const data = await res.json();

    if (!data.success) {
      alert("❌ Access denied");
      location.href = "/founder-login.html";
      return;
    }

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

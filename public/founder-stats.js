async function loadFounderStats() {
  try {
    const res = await fetch("/api/founder/stats");
    const data = await res.json();

    if (!data.success) {
      alert("Failed to load stats");
      return;
    }

    set("totalUsers", data.totalUsers);
    set("proUsers", data.proUsers);
    set("founders", data.founders);
    set("totalBalance", data.totalBalance);
    set("totalTokens", data.totalTokens);
    set("totalReferrals", data.totalReferrals);

    animateCards();

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

function set(id, value) {
  document.getElementById(id).innerText = value;
}

function animateCards() {
  document.querySelectorAll(".founder-card")
    .forEach((card, i) => {
      setTimeout(() => {
        card.classList.add("enter");
      }, i * 120);
    });
}

document.addEventListener("DOMContentLoaded", loadFounderStats);

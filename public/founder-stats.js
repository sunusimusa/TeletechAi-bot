async function loadFounderStats() {
  try {
    const res = await fetch("/api/founder/stats");
    const data = await res.json();

    if (!data.success) {
      alert("❌ Failed to load stats");
      return;
    }

    document.getElementById("totalUsers").innerText =
      data.users.toLocaleString();

    document.getElementById("totalBalance").innerText =
      data.balance.toLocaleString();

    document.getElementById("totalTokens").innerText =
      data.tokens.toLocaleString();

    document.getElementById("totalEnergy").innerText =
      data.energy.toLocaleString();

    document.getElementById("totalReferrals").innerText =
      data.referrals.toLocaleString();

  } catch (err) {
    alert("❌ Network error");
  }
}

function goBack() {
  window.location.href = "/";
}

document.addEventListener("DOMContentLoaded", loadFounderStats);

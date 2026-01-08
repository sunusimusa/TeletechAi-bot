async function loadFounderStats() {
  try {
    const res = await fetch("/api/founder/stats");
    const data = await res.json();

    if (data.error) {
      alert("⛔ Access denied");
      window.location.href = "/dashboard.html";
      return;
    }

    document.getElementById("totalUsers").innerText = data.totalUsers;
    document.getElementById("proUsers").innerText = data.proUsers;
    document.getElementById("founders").innerText = data.founders;
    document.getElementById("totalTokens").innerText = data.totalTokens;
    document.getElementById("systemBalance").innerText = data.systemBalance;
    document.getElementById("totalReferrals").innerText = data.totalReferrals;

  } catch (err) {
    console.error(err);
    alert("❌ Failed to load founder stats");
  }
}

function goBack() {
  window.location.href = "/dashboard.html";
}

document.addEventListener("DOMContentLoaded", loadFounderStats);

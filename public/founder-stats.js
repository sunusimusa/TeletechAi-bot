// Telegram check
if (!window.Telegram?.WebApp?.initDataUnsafe?.user) {
  alert("❌ Open from Telegram");
  throw new Error("Not Telegram");
}

const tg = Telegram.WebApp;
tg.expand();

async function loadFounderStats() {
  try {
    const res = await fetch("/api/founder/stats", {
      cache: "no-store"
    });

    const data = await res.json();
    if (data.error) throw data.error;

    document.getElementById("totalUsers").innerText = data.totalUsers;
    document.getElementById("proUsers").innerText = data.proUsers;
    document.getElementById("founders").innerText = data.founders;
    document.getElementById("totalTokens").innerText = data.totalTokens;
    document.getElementById("systemBalance").innerText = data.systemBalance;
    document.getElementById("totalReferrals").innerText = data.totalReferrals;

  } catch (err) {
    alert("❌ Failed to load founder stats");
    console.error(err);
  }
}

function goBack() {
  window.location.href = "/dashboard.html";
}

loadFounderStats();

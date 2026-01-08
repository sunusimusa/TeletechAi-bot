// ================== FOUNDER DASHBOARD SCRIPT ==================

// 🔒 Dole TELEGRAM_ID ya fito daga Telegram WebApp
// Misali: const TELEGRAM_ID = Telegram.WebApp.initDataUnsafe.user.id;

async function loadFounderStats() {
  try {
    const res = await fetch("/api/founder/stats", {
      headers: {
        "x-telegram-id": TELEGRAM_ID // 👑 SECURITY
      }
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      alert("⛔ Access denied");
      window.location.href = "/dashboard.html";
      return;
    }

    // ===== UPDATE CARDS =====
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

// ================== ANALYTICS (CHARTS) ==================
async function loadAnalytics() {
  try {
    const res = await fetch("/api/founder/analytics", {
      headers: {
        "x-telegram-id": TELEGRAM_ID // 👑 SECURITY
      }
    });

    const data = await res.json();
    if (!res.ok || data.error) throw data.error;

    // 📈 USERS GROWTH CHART
    const userLabels = data.usersGrowth.map(u => u._id);
    const userCounts = data.usersGrowth.map(u => u.count);

    new Chart(document.getElementById("usersChart"), {
      type: "line",
      data: {
        labels: userLabels,
        datasets: [{
          label: "New Users",
          data: userCounts,
          borderWidth: 2,
          borderColor: "#4ade80",
          tension: 0.4
        }]
      }
    });

    // 💰 REVENUE CHART
    new Chart(document.getElementById("revenueChart"), {
      type: "bar",
      data: {
        labels: ["Tokens", "Balance"],
        datasets: [{
          label: "Revenue",
          data: [
            data.revenue.totalTokens,
            data.revenue.totalBalance
          ],
          backgroundColor: ["#60a5fa", "#facc15"]
        }]
      }
    });

  } catch (err) {
    console.error(err);
    alert("⛔ Access denied");
    window.location.href = "/dashboard.html";
  }
}

// ================== NAV ==================
function goBack() {
  window.location.href = "/dashboard.html";
}

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", () => {
  loadFounderStats();
  loadAnalytics();
});

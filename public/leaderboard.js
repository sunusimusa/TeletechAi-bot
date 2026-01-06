document.addEventListener("DOMContentLoaded", loadLeaderboard);

async function loadLeaderboard() {
  const seasonEl = document.getElementById("season");
  const listEl = document.getElementById("leaderboard");

  seasonEl.innerText = "Loading season...";
  listEl.innerHTML = "<p>Loading leaderboard...</p>";

  try {
    const res = await fetch("/api/ref/leaderboard", {
      method: "GET",
      headers: {
        "Accept": "application/json"
      },
      cache: "no-store" // ✅ MUHIMMI (Telegram bug fix)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log("Leaderboard:", data);

    // ===== SEASON =====
    seasonEl.innerText = data.season || "Season";

    // ===== EMPTY =====
    if (!Array.isArray(data.top) || data.top.length === 0) {
      listEl.innerHTML =
        "<p style='color:gray'>No referrals yet</p>";
      return;
    }

    // ===== RENDER =====
    listEl.innerHTML = "";

    data.top.forEach((u, i) => {
      const row = document.createElement("div");
      row.className = "rank";

      row.innerHTML = `
        <span>#${i + 1}</span>
        <span>${u.telegramId}</span>
        <span>👥 ${u.seasonReferrals}</span>
      `;

      listEl.appendChild(row);
    });

  } catch (err) {
    console.error("Leaderboard error:", err);
    seasonEl.innerText = "Error";
    listEl.innerHTML =
      "<p style='color:red'>❌ Failed to load leaderboard</p>";
  }
}

// ===== BACK BUTTON FIX =====
document.getElementById("backBtn").addEventListener("click", () => {
  if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.close(); // 🔙 komawa Telegram
  } else {
    window.history.back(); // 🔙 fallback
  }
});

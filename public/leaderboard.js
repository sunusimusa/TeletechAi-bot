document.addEventListener("DOMContentLoaded", loadLeaderboard);

const API_BASE = "https://teletechai.onrender.com";

async function loadLeaderboard() {
  const seasonEl = document.getElementById("season");
  const listEl = document.getElementById("leaderboard");

  try {
    const res = await fetch(`${API_BASE}/api/ref/leaderboard`);

    if (!res.ok) {
      throw new Error("Server not reachable");
    }

    const data = await res.json();

    seasonEl.innerText = data.season || "Season";

    listEl.innerHTML = "";

    if (!data.top || data.top.length === 0) {
      listEl.innerHTML =
        "<p style='color:gray'>No referrals yet</p>";
      return;
    }

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
    console.error(err);
    seasonEl.innerText = "Error";
    listEl.innerHTML =
      "<p style='color:red'>❌ Failed to load leaderboard</p>";
  }
}

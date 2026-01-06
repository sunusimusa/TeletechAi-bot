document.addEventListener("DOMContentLoaded", loadLeaderboard);

async function loadLeaderboard() {
  const seasonEl = document.getElementById("season");
  const listEl = document.getElementById("leaderboard");

  try {
    const res = await fetch("/api/ref/leaderboard");

    if (!res.ok) {
      throw new Error("Server error");
    }

    const data = await res.json();

    // 🏆 Season
    seasonEl.innerText = data.season;

    // 🧹 clear loading
    listEl.innerHTML = "";

    if (!data.top || data.top.length === 0) {
      listEl.innerHTML =
        "<p style='color:gray'>No referrals yet</p>";
      return;
    }

    data.top.forEach((user, index) => {
      const row = document.createElement("div");
      row.className = "rank";

      row.innerHTML = `
        <span>#${index + 1}</span>
        <span>${user.telegramId}</span>
        <span>👥 ${user.seasonReferrals}</span>
      `;

      listEl.appendChild(row);
    });

  } catch (err) {
    console.error(err);
    seasonEl.innerText = "Failed to load season";
    listEl.innerHTML =
      "<p style='color:red'>❌ Failed to load leaderboard</p>";
  }
}

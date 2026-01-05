async function loadLeaderboard() {
  const res = await fetch("/api/ref/leaderboard");
  const data = await res.json();

  const seasonInfo = document.getElementById("seasonInfo");
  seasonInfo.innerText =
    `${data.season} | ${new Date(data.start).toDateString()} → ${new Date(data.end).toDateString()}`;

  const list = document.getElementById("leaderboard");
  list.innerHTML = "";

  if (!data.top || data.top.length === 0) {
    list.innerHTML = "<p>No data yet</p>";
    return;
  }

  data.top.forEach((user, index) => {
    const row = document.createElement("div");
    row.className = "lb-item";

    let medal = "🎖️";
    if (index === 0) medal = "🥇";
    if (index === 1) medal = "🥈";
    if (index === 2) medal = "🥉";

    row.innerHTML = `
      <div class="lb-rank">${medal} #${index + 1}</div>
      <div class="lb-user">
        User ${user.telegramId}
        <br>
        <small>${user.referralsCount} referrals</small>
      </div>
    `;

    list.appendChild(row);
  });
}

function goBack() {
  window.history.back();
}

function calcDaysLeft(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;

  if (diff <= 0) return "Season ended";

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `${days} day${days > 1 ? "s" : ""} left ⏳`;
}

loadLeaderboard();

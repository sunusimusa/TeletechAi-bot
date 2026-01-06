// ================= ELEMENTS =================
const seasonInfo = document.getElementById("seasonInfo");
const list = document.getElementById("leaderboard");

// ================= HELPERS =================
function calcDaysLeft(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;

  if (diff <= 0) return "Season ended";

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `${days} day${days > 1 ? "s" : ""} left ⏳`;
}

// ================= LOAD LEADERBOARD =================
async function loadLeaderboard() {
  const res = await fetch("/api/ref/leaderboard");
  const data = await res.json();

  const list = document.getElementById("leaderboard");
  list.innerHTML = "";

  if (!data.top || data.top.length === 0) {
    list.innerHTML = "<p>No referrals yet</p>";
    return;
  }

  data.top.forEach((u, i) => {
    const row = document.createElement("div");
    row.className = "lb-item";

    let medal = "🎖️";
    if (i === 0) medal = "🥇";
    if (i === 1) medal = "🥈";
    if (i === 2) medal = "🥉";

    row.innerHTML = `
      <b>${medal} #${i + 1}</b>
      <span>User ${u.telegramId}</span>
      <small>${u.seasonReferrals} referrals</small>
    `;

    list.appendChild(row);
  });
}

loadLeaderboard();

  } catch (err) {
    console.error(err);
    list.innerHTML = "<p>Failed to load leaderboard</p>";
  }
}

// ================= NAV =================
function goBack() {
  window.history.back();
}

// ================= INIT =================
loadLeaderboard();

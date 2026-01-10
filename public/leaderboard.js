async function loadLeaderboard() {
  const body = document.getElementById("leaderboardBody");

  try {
    const res = await fetch("/api/leaderboard/referrals");
    const data = await res.json();

    if (!data.success || data.users.length === 0) {
      body.innerHTML =
        `<tr><td colspan="3">No referrals yet</td></tr>`;
      return;
    }

    body.innerHTML = "";

    data.users.forEach((u, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${u.userId}</td>
        <td>${u.referrals}</td>
      `;
      body.appendChild(tr);
    });

  } catch (err) {
    body.innerHTML =
      `<tr><td colspan="3">Failed to load</td></tr>`;
  }
}

function goBack() {
  window.history.back();
}

document.addEventListener("DOMContentLoaded", loadLeaderboard);

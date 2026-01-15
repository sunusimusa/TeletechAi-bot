/* =====================================================
   LEADERBOARD – FINAL CLEAN
   SERVER = SOURCE OF TRUTH
   NO localStorage
===================================================== */

const listEl = document.getElementById("leaderboardList");
const msgEl = document.getElementById("lbMsg");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadLeaderboard("balance");
});

/* ================= LOAD LEADERBOARD ================= */
async function loadLeaderboard(type = "balance") {
  listEl.innerHTML = "";
  msgEl.innerText = "⏳ Loading...";

  try {
    const res = await fetch(`/api/leaderboard?type=${type}`, {
      credentials: "include"
    });

    const data = await res.json();

    if (!data.success || !data.list || data.list.length === 0) {
      msgEl.innerText = "❌ No data";
      return;
    }

    msgEl.innerText = "";

    data.list.forEach((u, i) => {
      const li = document.createElement("li");

      let value = "";
      if (type === "balance") value = `💰 ${u.balance}`;
      if (type === "tokens") value = `🪙 ${u.tokens}`;
      if (type === "referrals") value = `👥 ${u.referralsCount}`;

      li.innerHTML = `
        <span>#${i + 1}</span>
        <span>${maskUser(u.userId)}</span>
        <span>${value}</span>
      `;

      listEl.appendChild(li);
    });

  } catch (e) {
    msgEl.innerText = "❌ Network error";
  }
}

/* ================= HELPERS ================= */
function maskUser(id) {
  if (!id) return "User";
  return id.slice(0, 4) + "***" + id.slice(-3);
}

function backToGame() {
  location.href = "/";
}

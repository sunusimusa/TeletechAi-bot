/* =====================================================
   LEADERBOARD – FINAL CLEAN
   SERVER = SOURCE OF TRUTH
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadBoard("balance");
});

/* ================= LOAD BOARD ================= */
async function loadBoard(type) {
  setActive(type);
  setTitle(type);

  const status = document.getElementById("status");
  const table = document.getElementById("board");
  const body = document.getElementById("boardBody");

  status.innerText = "⏳ Loading...";
  table.classList.add("hidden");
  body.innerHTML = "";

  try {
    const res = await fetch(`/api/leaderboard?type=${type}`);
    const data = await res.json();

    if (!data.success || !data.list || data.list.length === 0) {
      status.innerText = "❌ No data";
      return;
    }

    data.list.forEach((u, i) => {
      const tr = document.createElement("tr");

      const value =
        type === "tokens" ? u.tokens :
        type === "referrals" ? u.referralsCount :
        u.balance;

      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${maskUser(u.userId)}</td>
        <td>${value}</td>
        <td>${u.proLevel || 0}</td>
      `;
      body.appendChild(tr);
    });

    status.innerText = "";
    table.classList.remove("hidden");

  } catch (e) {
    status.innerText = "❌ Network error";
  }
}

/* ================= UI HELPERS ================= */
function setActive(type) {
  ["balance", "tokens", "referrals"].forEach(t => {
    const btn = document.getElementById("tab-" + t);
    if (btn) btn.classList.toggle("active", t === type);
  });
}

function setTitle(type) {
  const el = document.getElementById("valueTitle");
  if (!el) return;

  el.innerText =
    type === "tokens" ? "Tokens" :
    type === "referrals" ? "Referrals" :
    "Balance";
}

function maskUser(id) {
  if (!id) return "USER";
  return id.slice(0, 4) + "***" + id.slice(-2);
}

function back() {
  location.href = "/";
}

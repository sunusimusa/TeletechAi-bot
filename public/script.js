const tg = window.Telegram.WebApp;
tg.expand();

let userId = null;

// ================= INIT =================
async function init() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      initData: tg.initDataUnsafe
    })
  });

  const data = await res.json();

  userId = data.id;

  updateUI(data);
  setReferralLink();
}

function updateUI(data) {
  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;

  if (document.getElementById("level")) {
    document.getElementById("level").innerText = data.level || 1;
  }
}

// ================= TAP =================
async function tap() {
  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  updateUI(data);
}

// ================= DAILY =================
async function daily() {
  const res = await fetch("/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  updateUI(data);
}

// ================= REFERRAL =================
function setReferralLink() {
  const link = `https://t.me/teletechai_bot?start=${userId}`;
  document.getElementById("refLink").value = link;
}

function copyInvite() {
  const input = document.getElementById("refLink");
  input.select();
  document.execCommand("copy");
  alert("Invite link copied!");
}

// ================= LEADERBOARD =================
async function loadLeaderboard() {
  const res = await fetch("/leaderboard");
  const data = await res.json();

  const board = document.getElementById("board");
  board.innerHTML = "";

  data.forEach(u => {
    board.innerHTML += `🏆 ${u.id} — ${u.balance}<br>`;
  });
}

// ================= START =================
init();
loadLeaderboard();

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

  if (data.error) {
    alert(data.error);
    return;
  }

  userId = data.id;

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;

  setReferralLink();
  loadBoard();
}

init();

// ================= TAP =================
async function tap() {
  if (!userId) return alert("Loading...");

  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
}

// ================= DAILY =================
async function daily() {
  if (!userId) return alert("Loading...");

  const res = await fetch("/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  alert(data.error || "Daily reward claimed!");
  document.getElementById("balance").innerText = data.balance;
}

// ================= REFERRAL =================
function setReferralLink() {
  document.getElementById("refLink").value =
    `https://t.me/YOUR_BOT_USERNAME?start=${userId}`;
}

function copyInvite() {
  const input = document.getElementById("refLink");
  input.select();
  input.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(input.value);
  alert("Invite link copied ✅");
}

// ================= LEADERBOARD =================
async function loadBoard() {
  const res = await fetch("/leaderboard");
  const data = await res.json();

  document.getElementById("board").innerHTML =
    data.map(u => `🏆 ${u.id} — ${u.balance}`).join("<br>");
}

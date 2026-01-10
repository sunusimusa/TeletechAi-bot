// DEMO GLOBAL STATS (browser-only)
function loadFounderStats() {
  // zaka iya maida su real daga backend daga baya
  const users = Number(localStorage.getItem("usersCount")) || 1;
  const balance = Number(localStorage.getItem("balance")) || 0;
  const tokens = Number(localStorage.getItem("tokens")) || 0;
  const energy = Number(localStorage.getItem("energy")) || 0;

  document.getElementById("totalUsers").innerText = users;
  document.getElementById("totalBalance").innerText = balance;
  document.getElementById("totalTokens").innerText = tokens;
  document.getElementById("totalEnergy").innerText = energy;
}

function goBack() {
  location.href = "/";
}

document.addEventListener("DOMContentLoaded", loadFounderStats);

/* =================================================
   FOUNDER STATS (BROWSER ONLY)
================================================= */

/* 🔐 FOUNDER CONFIG */
const FOUNDER_USER_ID = "SUNUSI_001";

/* 👤 CURRENT USER */
const currentUser =
  localStorage.getItem("userId") || FOUNDER_USER_ID;

/* 🚫 BLOCK NON-FOUNDER */
if (currentUser !== FOUNDER_USER_ID) {
  alert("❌ Access denied");
  location.href = "/";
}

/* SHOW ID */
document.getElementById("founderId").textContent = currentUser;

/* =================================================
   FAKE GLOBAL DATA (for now)
   Later zaka haɗa backend
================================================= */
let stats = {
  totalUsers: 248,
  proUsers: 63,
  founders: 1,
  totalTokens: 12840,
  totalEnergy: 542000
};

/* =================================================
   LOAD STATS
================================================= */
function loadStats() {
  document.getElementById("totalUsers").textContent = stats.totalUsers;
  document.getElementById("proUsers").textContent = stats.proUsers;
  document.getElementById("founders").textContent = stats.founders;
  document.getElementById("totalTokens").textContent = stats.totalTokens;
  document.getElementById("totalEnergy").textContent = stats.totalEnergy;
}

loadStats();

/* =================================================
   LOGGING
================================================= */
function log(msg) {
  document.getElementById("logBox").textContent =
    new Date().toLocaleTimeString() + " → " + msg;
}

/* =================================================
   ACTIONS
================================================= */
function mintTokens() {
  stats.totalTokens += 100;
  loadStats();
  log("Minted +100 tokens");
}

function resetSeason() {
  if (!confirm("Reset referral season?")) return;
  log("Referral season reset");
}

/* =================================================
   NAVIGATION
================================================= */
function goBack() {
  location.href = "/";
}

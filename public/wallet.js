/* ================= GLOBAL ================= */
const USER_ID = localStorage.getItem("userId") || "SUNUSI_001";

let tokens = Number(localStorage.getItem("tokens")) || 0;
let wallet = localStorage.getItem("wallet");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  ensureWallet();
  updateUI();
});

/* ================= WALLET ================= */
function ensureWallet() {
  if (!wallet) {
    wallet = "TTECH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem("wallet", wallet);
  }
}

function updateUI() {
  document.getElementById("walletBalance").innerText = tokens + " TTECH";
  document.getElementById("myWallet").value = wallet;
}

/* ================= ACTIONS ================= */
function copyWallet() {
  navigator.clipboard.writeText(wallet);
  showMsg("✅ Wallet address copied");
}

document.getElementById("sendBtn").onclick = sendToken;

function sendToken() {
  const to = document.getElementById("toAddress").value.trim();
  const amount = Number(document.getElementById("sendAmount").value);

  if (!to || !amount || amount <= 0) {
    showMsg("❌ Invalid input");
    return;
  }

  if (tokens < amount) {
    showMsg("❌ Not enough tokens");
    return;
  }

  // DEMO TRANSFER (browser-only)
  tokens -= amount;
  localStorage.setItem("tokens", tokens);

  updateUI();

  document.getElementById("toAddress").value = "";
  document.getElementById("sendAmount").value = "";

  showMsg(`✅ Sent ${amount} TTECH`);
}

function showMsg(text) {
  const msg = document.getElementById("walletMsg");
  msg.innerText = text;
}

/* ================= NAV ================= */
function goBack() {
  location.href = "/";
    }

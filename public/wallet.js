/* ================= INIT WALLET ================= */
const USER_ID = localStorage.getItem("userId") || "SUNUSI_001";

function initWallet() {
  let wallet = localStorage.getItem("wallet");

  if (!wallet) {
    wallet = "TTECH-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    localStorage.setItem("wallet", wallet);
  }

  const tokens = Number(localStorage.getItem("tokens")) || 0;

  document.getElementById("walletAddress").innerText = wallet;
  document.getElementById("walletTokens").innerText = tokens;

  generateQR(wallet);
}

/* ================= QR ================= */
function generateQR(text) {
  const img = document.getElementById("qrImage");
  img.src =
    "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" +
    encodeURIComponent(text);
}

/* ================= COPY ================= */
function copyWallet() {
  const text = document.getElementById("walletAddress").innerText;
  navigator.clipboard.writeText(text);
  alert("✅ Wallet copied");
}

/* ================= ACTIONS ================= */
function openSend() {
  alert("🚧 Send feature coming next (backend)");
}

function openReceive() {
  alert("📥 Share your wallet address or QR");
}

document.addEventListener("DOMContentLoaded", initWallet);

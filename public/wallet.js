const tg = Telegram.WebApp;
const TELEGRAM_ID = tg.initDataUnsafe.user.id;

async function loadWallet() {
  const res = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  });

  const data = await res.json();

  const addr = data.walletAddress;
  document.getElementById("walletAddr").innerText = addr;

  // QR code (free API)
  document.getElementById("qrImg").src =
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${addr}`;
}

function copyWallet() {
  const text = document.getElementById("walletAddr").innerText;
  navigator.clipboard.writeText(text);
  alert("✅ Wallet copied");
}

function goBack() {
  window.history.back();
}

loadWallet();

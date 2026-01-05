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

async function sendToken() {
  const toWallet = document.getElementById("toWallet").value;
  const amount = Number(document.getElementById("amount").value);

  if (!toWallet || amount <= 0)
    return alert("Invalid data");

  const res = await fetch("/api/wallet/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: TELEGRAM_ID,
      toWallet,
      amount
    })
  });

  const data = await res.json();

  if (data.error) {
    return alert(data.error.replaceAll("_", " "));
  }

  alert(`✅ Sent ${data.sent} TOKEN\n⛽ Gas: ${data.gasFee}`);
  loadUser();
}

async function sendToken() {
  const toWallet = document.getElementById("toWallet").value.trim();
  const amount = Number(document.getElementById("amount").value);

  if (!toWallet || amount <= 0) {
    alert("Invalid data");
    return;
  }

  const res = await fetch("/api/wallet/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: TELEGRAM_ID,
      toWallet,
      amount
    })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error.replaceAll("_", " "));
    return;
  }

  alert(
    `✅ Sent ${data.sent} TOKEN\n⛽ Gas Fee: ${data.gasFee}`
  );

  loadUser(); // refresh balance
}

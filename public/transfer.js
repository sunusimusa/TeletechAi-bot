const tg = window.Telegram.WebApp;
tg.expand();

const TELEGRAM_ID = tg.initDataUnsafe?.user?.id;

const toInput = document.getElementById("toId");
const amountInput = document.getElementById("amount");
const gasPreview = document.getElementById("gasPreview");
const msg = document.getElementById("transferMsg");

let tier = "free";

// OPTIONAL: idan kana turo tier daga /api/user
async function detectTier() {
  const res = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  });
  const data = await res.json();

  if (data.isPro && data.proLevel >= 3) tier = "pro3";
  else if (data.isPro && data.proLevel === 2) tier = "pro2";
  else if (data.isPro && data.proLevel === 1) tier = "pro1";
  else tier = "free";
}

detectTier();

// ===== GAS PREVIEW =====
amountInput.addEventListener("input", () => {
  const amt = Number(amountInput.value);
  if (!amt || amt <= 0) {
    gasPreview.innerText = "⛽ Gas: —";
    return;
  }

  let gasRate = 0.1;
  if (tier === "pro1") gasRate = 0.05;
  if (tier === "pro2") gasRate = 0.02;
  if (tier === "pro3") gasRate = 0;

  const gas = Math.ceil(amt * gasRate);
  const receive = amt - gas;

  gasPreview.innerText =
    `⛽ Gas: ${gas} | 📥 Receiver gets: ${receive}`;
});

// ===== SEND TOKEN =====
async function sendToken() {
  msg.innerText = "";

  const toTelegramId = toInput.value.trim();
  const amount = Number(amountInput.value);

  if (!toTelegramId || !amount || amount <= 0) {
    msg.innerText = "❌ Fill all fields";
    return;
  }

  if (!confirm(`Send ${amount} token(s)?`)) return;

  const res = await fetch("/api/token/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fromTelegramId: TELEGRAM_ID,
      toTelegramId,
      amount
    })
  });

  const data = await res.json();

  if (data.error) {
    msg.innerText = "❌ " + data.error.replaceAll("_", " ");
    return;
  }

  msg.innerText =
    `✅ Sent ${data.sent} | Received ${data.received} | Gas ${data.gas}`;
  
  amountInput.value = "";
  gasPreview.innerText = "⛽ Gas: —";
}

function goBack() {
  window.history.back();
      }

const TELEGRAM_ID =
  window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

let timeLeft = 30;
const btn = document.getElementById("claimBtn");

// ⏳ COUNTDOWN
const timer = setInterval(() => {
  timeLeft--;
  btn.innerText = `⏳ Please wait (${timeLeft}s)`;

  if (timeLeft <= 0) {
    clearInterval(timer);
    btn.disabled = false;
    btn.innerText = "⚡ Claim Free Energy";
    btn.classList.add("ready");
  }
}, 1000);

// ⚡ CLAIM ENERGY
btn.addEventListener("click", async () => {
  btn.disabled = true;
  btn.innerText = "⏳ Claiming...";

  const res = await fetch("/api/ads/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    btn.innerText = "❌ Failed";
    return;
  }

  btn.innerText = "✅ Energy Added!";
  setTimeout(() => {
    window.location.href = "/";
  }, 1200);
});

function goBack() {
  window.location.href = "/";
}

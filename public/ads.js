const tg = window.Telegram?.WebApp;
tg?.expand();

let seconds = 30;
const btn = document.getElementById("claimBtn");
const timerText = document.getElementById("timer");

btn.disabled = true;
btn.innerText = `⏳ Please wait (${seconds}s)`;

const timer = setInterval(() => {
  seconds--;
  timerText.innerText = `⏳ ${seconds} seconds remaining`;
  btn.innerText = `⏳ Please wait (${seconds}s)`;

  if (seconds <= 0) {
    clearInterval(timer);
    btn.disabled = false;
    btn.classList.add("ready");
    btn.innerText = "⚡ Claim Free Energy";
  }
}, 1000);

btn.onclick = async () => {
  btn.disabled = true;
  btn.innerText = "⏳ Claiming...";

  const telegramId =
    tg?.initDataUnsafe?.user?.id;

  if (!telegramId) {
    alert("Telegram not detected");
    return;
  }

  const res = await fetch("/api/ads/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error.replaceAll("_", " "));
    btn.innerText = "❌ Try later";
    return;
  }

  alert(`🎉 +${data.rewardEnergy} Energy`);
  window.location.href = "/index.html";
};

function goBack() {
  window.location.href = "/index.html";
}

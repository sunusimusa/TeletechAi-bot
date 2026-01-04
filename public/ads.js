document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram?.WebApp;
  const userId = tg?.initDataUnsafe?.user?.id;

  const btn = document.getElementById("claimBtn");
  const timerText = document.getElementById("timerText");

  let seconds = 30;

  btn.disabled = true;
  btn.classList.remove("ready");

  function updateUI() {
    btn.innerText = `⏳ Please wait (${seconds}s)`;
    timerText.innerText = `⏳ Please wait (${seconds}s)`;
  }

  updateUI();

  const interval = setInterval(() => {
    seconds--;

    if (seconds <= 0) {
      clearInterval(interval);
      btn.disabled = false;
      btn.classList.add("ready");
      btn.innerText = "⚡ Claim Free Energy";
      timerText.innerText = "✅ Ad completed";
      return;
    }

    updateUI();
  }, 1000);

  btn.addEventListener("click", async () => {
    if (btn.disabled) return;

    btn.disabled = true;
    btn.innerText = "⏳ Claiming...";

    try {
      const res = await fetch("/api/ads/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: userId })
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error.replaceAll("_", " "));
        btn.innerText = "❌ Try later";
        return;
      }

      alert(`🎉 +${data.rewardEnergy} Energy`);
      window.location.href = "/index.html";
    } catch (e) {
      alert("Network error");
      btn.innerText = "❌ Error";
    }
  });
});

function goBack() {
  window.location.href = "/index.html";
}

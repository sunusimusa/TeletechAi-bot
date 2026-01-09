const tg = window.Telegram?.WebApp;

if (!tg) {
  document.getElementById("status").innerText =
    "❌ Open this app from Telegram";
} else {
  tg.ready();

  const telegramId = tg.initDataUnsafe?.user?.id;

  if (!telegramId) {
    document.getElementById("status").innerText =
      "❌ Telegram ID not found";
  } else {
    fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId })
    })
      .then(res => res.json())
      .then(data => {
        document.getElementById("status").innerText =
          "✅ Welcome! Balance: " + data.balance;
      })
      .catch(() => {
        document.getElementById("status").innerText =
          "❌ API Error";
      });
  }
}

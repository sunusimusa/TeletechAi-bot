// ================= TELEGRAM INIT =================
const tg = window.Telegram?.WebApp;

if (!tg) {
  alert("❌ Please open this app from Telegram");
} else {
  tg.ready();
  tg.expand();

  const TELEGRAM_ID =
    tg.initDataUnsafe?.user?.id || "guest";

  console.log("Telegram ID:", TELEGRAM_ID);

  document.body.insertAdjacentHTML(
    "beforeend",
    `<p style="margin-top:20px;color:green;">
      ✅ App Loaded<br/>
      Telegram ID: ${TELEGRAM_ID}
    </p>`
  );
}

/* ===============================
   CONFIG – SAKA NAKAN LINKS
================================ */

// 🔴 SAKA SUNAN CHANNEL DINKA ANAN
const YOUTUBE_CHANNEL =
  "https://youtube.com/@Sunusicrypto"; // <- canza nan

const TELEGRAM_CHAT =
  "https://t.me/tele_tap_ai"; // <- public chat

const TELEGRAM_UPDATE =
  "https://t.me/TeleAIupdates"; // <- update channel


/* ===============================
   GLOBAL
================================ */
const userId = localStorage.getItem("userId");
const msg = document.getElementById("taskMsg");

/* ===============================
   WATCH AD TASK
================================ */
async function watchAdTask() {
  msg.innerText = "⏳ Watching ad...";

  // fake delay (ad time)
  setTimeout(async () => {
    const res = await fetch("/api/task/watch-ad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();

    if (data.error) {
      msg.innerText = "❌ Task already completed";
      return;
    }

    msg.innerText = "✅ +20 Energy & +200 Coins added!";
  }, 5000);
}

/* ===============================
   SOCIAL TASK (YT / TG)
================================ */
async function completeSocialTask(type) {
  msg.innerText = "⏳ Verifying task...";

  // delay don ya bude link sosai
  setTimeout(async () => {
    const res = await fetch("/api/task/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, type })
    });

    const data = await res.json();

    if (data.error) {
      msg.innerText = "❌ Task already done";
      return;
    }

    msg.innerText = "🎉 +300 Coins added!";
  }, 3000);
}

/* ===============================
   OPEN LINKS
================================ */
function openYouTube() {
  window.open(YOUTUBE_CHANNEL, "_blank");
  completeSocialTask("youtube");
}

function openTelegramChat() {
  window.open(TELEGRAM_CHAT, "_blank");
  completeSocialTask("telegramChat");
}

function openTelegramUpdate() {
  window.open(TELEGRAM_UPDATE, "_blank");
  completeSocialTask("telegramUpdate");
}

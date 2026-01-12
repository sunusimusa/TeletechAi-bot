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
let adTimer = null;

function watchAd() {
  const btn = document.getElementById("watchAdBtn");
  const status = document.getElementById("adStatus");

  let timeLeft = 30;

  btn.disabled = true;
  btn.innerText = "Watching...";
  status.classList.remove("hidden");
  status.innerText = `⏳ Watching ad... ${timeLeft}s`;

  adTimer = setInterval(() => {
    timeLeft--;
    status.innerText = `⏳ Watching ad... ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(adTimer);

      // 🎁 REWARD
      energy += 20;
      balance += 200;

      updateUI();

      status.innerText = "✅ Ad completed! Reward added";
      btn.innerText = "📺 Watch Ad (+20 ⚡ +200 💰)";
      btn.disabled = false;

      setTimeout(() => {
        status.classList.add("hidden");
      }, 2000);
    }
  }, 1000);
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

function verifyTelegram(type) {
  const telegramId = localStorage.getItem("telegramId");

  if (!telegramId) {
    alert("❌ Open app from Telegram first");
    return;
  }

  fetch("/api/task/verify-telegram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: localStorage.getItem("userId"),
      telegramId,
      type
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert("❌ " + data.error);
        return;
      }
      alert("✅ Task verified +300 coins!");
    });
}

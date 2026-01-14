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
let adTimeLeft = 30;

async function watchAd() {
  const btn = document.getElementById("watchAdBtn");
  const status = document.getElementById("adStatus");

  if (!btn || !status) return;

  btn.disabled = true;
  btn.innerText = "Watching...";
  status.classList.remove("hidden");

  adTimeLeft = 30;
  status.innerText = `⏳ Watching ad... ${adTimeLeft}s`;

  adTimer = setInterval(async () => {
    adTimeLeft--;

    status.innerText = `⏳ Watching ad... ${adTimeLeft}s`;

    if (adTimeLeft <= 0) {
      clearInterval(adTimer);

      // 📡 CLAIM FROM SERVER
      try {
        const res = await fetch("/api/ads/watch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: localStorage.getItem("userId")
          })
        });

        const data = await res.json();

        if (data.error) {
          status.innerText = "❌ Ad limit reached";
        } else {
          status.innerText = "✅ +20 ⚡ +100 💰 added!";
          balance = data.balance;
          energy = data.energy;
          updateUI();
        }

      } catch (e) {
        status.innerText = "❌ Network error";
      }

      btn.disabled = false;
      btn.innerText = "📺 Watch Ad (+20 ⚡ +100 💰)";

      setTimeout(() => {
        status.classList.add("hidden");
      }, 2500);
    }
  }, 1000);
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

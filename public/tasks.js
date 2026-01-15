/* =====================================================
   TASKS PAGE ONLY (NO GAME LOGIC HERE)
   SERVER = SOURCE OF TRUTH
===================================================== */

/* ================= CONFIG ================= */
const YOUTUBE_CHANNEL = "https://youtube.com/@Sunusicrypto";
const TELEGRAM_CHAT   = "https://t.me/tele_tap_ai";
const TELEGRAM_UPDATE = "https://t.me/TeleAIupdates";

/* ================= GLOBAL ================= */
const userId = localStorage.getItem("userId");
const msg = document.getElementById("taskMsg");

/* ================= WATCH AD ================= */
let adRunning = false;

async function watchAd() {
  if (!navigator.onLine) {
    alert("📡 Internet required");
    return;
  }

  if (!userId) {
    alert("❌ User not initialized");
    return;
  }

  if (adRunning) return;
  adRunning = true;

  const btn = document.getElementById("watchAdBtn");
  const status = document.getElementById("adStatus");

  if (!btn || !status) return;

  btn.disabled = true;
  status.classList.remove("hidden");

  let t = 30;
  status.innerText = `⏳ Watching ad... ${t}s`;

  const timer = setInterval(async () => {
    t--;
    status.innerText = `⏳ Watching ad... ${t}s`;

    if (t <= 0) {
      clearInterval(timer);

      try {
        const res = await fetch("/api/ads/watch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId })
        });

        const data = await res.json();

        if (data.error) {
          if (data.error === "DAILY_AD_LIMIT") {
            status.innerText = "🚫 Daily ad limit reached";
          } else if (data.error === "WAIT_30_SECONDS") {
            status.innerText = "⏳ Please wait before next ad";
          } else if (data.error === "USER_NOT_FOUND") {
            status.innerText = "🔄 Please reopen the app";
          } else {
            status.innerText = "❌ Action failed";
          }
        } else {
          status.innerText = "✅ Reward added (⚡ +20)";
        }

      } catch (e) {
        status.innerText = "❌ Network error";
      }

      setTimeout(() => {
        status.classList.add("hidden");
        btn.disabled = false;
        adRunning = false;
      }, 2500);
    }
  }, 1000);
}

/* ================= SOCIAL LINKS ================= */
function openYouTube() {
  window.open(YOUTUBE_CHANNEL, "_blank");
  showMsg("▶️ YouTube opened. Come back to claim.");
}

function openTelegramChat() {
  window.open(TELEGRAM_CHAT, "_blank");
  showMsg("💬 Telegram chat opened.");
}

function openTelegramUpdate() {
  window.open(TELEGRAM_UPDATE, "_blank");
  showMsg("📢 Update channel opened.");
}

/* ================= CLAIM SOCIAL TASK ================= */
async function claimTask(type) {
  if (!userId) {
    alert("❌ User not initialized");
    return;
  }

  try {
    const res = await fetch("/api/task/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, type })
    });

    const data = await res.json();

    if (data.error) {
      alert("❌ " + data.error);
      return;
    }

    alert("✅ Task completed + reward added!");

  } catch (e) {
    alert("❌ Network error");
  }
}

/* ================= HELPERS ================= */
function showMsg(text) {
  if (!msg) return;
  msg.innerText = text;
  setTimeout(() => (msg.innerText = ""), 3000);
}

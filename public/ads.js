const USER_ID = localStorage.getItem("userId") || "SUNUSI_001";

const adsMsg = document.getElementById("adsMsg");
const adsInfo = document.getElementById("adsInfo");
const btn = document.getElementById("watchAdBtn");

btn.onclick = watchAd;

async function watchAd() {
  adsMsg.innerText = "⏳ Watching ad...";
  btn.disabled = true;

  try {
    const res = await fetch("/api/ads/watch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: USER_ID })
    });

    const data = await res.json();

    if (data.error) {
      adsMsg.innerText = "❌ " + data.error.replaceAll("_", " ");
      btn.disabled = false;
      return;
    }

    adsMsg.innerText =
      `✅ +${data.rewardEnergy || 20} Energy, +${data.rewardCoins || 100} Coins`;

    adsInfo.innerText = `Ads left today: ${data.adsLeft}`;

  } catch (err) {
    adsMsg.innerText = "❌ Network error";
  }

  btn.disabled = false;
}

function goBack() {
  location.href = "/";
}

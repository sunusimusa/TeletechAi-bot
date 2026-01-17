let USER = null;

// 🔑 tabbatar da user
async function initTasks() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (!data.success) throw "NO_USER";

    USER = data;

  } catch {
    alert("❌ User not initialized");
  }
}

initTasks();

/* ================= WATCH AD ================= */
async function watchAd() {
  if (!USER) {
    alert("User not initialized");
    return;
  }

  const status = document.getElementById("adStatus");
  status.classList.remove("hidden");
  status.innerText = "⏳ Watching ad...";

  try {
    const res = await fetch("/api/ads/watch", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) {
      status.innerText = "❌ " + data.error;
      return;
    }

    status.innerText = "✅ Energy added!";
  } catch {
    status.innerText = "❌ Network error";
  }
}

/* ================= YOUTUBE ================= */
function openYouTube() {
  window.open("https://youtube.com/@Sunusicrypto", "_blank");
}

async function claimYouTubeReward() {
  if (!USER) {
    alert("User not initialized");
    return;
  }

  try {
    const res = await fetch("/api/task/youtube", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) {
      alert(data.error);
      return;
    }

    alert("✅ +300 Balance added!");
  } catch {
    alert("❌ Network error");
  }
}

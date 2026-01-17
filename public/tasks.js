/* =====================================================
   TASKS & ADS – FINAL CLEAN SCRIPT
   FILE: public/tasks.js
   DEPENDS ONLY ON SERVER API
===================================================== */

let USER = null;

/* ================= INIT USER ================= */
async function initTasks() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error("NO_USER");
    }

    USER = data;
    console.log("✅ User initialized for tasks");

  } catch (err) {
    console.error("TASK INIT ERROR:", err);
    alert("❌ User not initialized");
  }
}

initTasks();

/* ================= WATCH AD ================= */
async function watchAd() {
  if (!USER) {
    alert("❌ User not initialized");
    return;
  }

  const status = document.getElementById("adStatus");
  if (status) {
    status.classList.remove("hidden");
    status.innerText = "⏳ Watching ad...";
  }

  try {
    const res = await fetch("/api/ads/watch", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();

    if (data.error) {
      if (status) status.innerText = "❌ " + data.error;
      return;
    }

    if (status) status.innerText = "✅ Energy added successfully!";

  } catch (err) {
    console.error("WATCH AD ERROR:", err);
    if (status) status.innerText = "❌ Network error";
  }
}

/* ================= YOUTUBE TASK ================= */
function openYouTube() {
  window.open("https://youtube.com/@Sunusicrypto", "_blank");
}

async function claimYouTubeReward() {
  if (!USER) {
    alert("❌ User not initialized");
    return;
  }

  try {
    const res = await fetch("/api/task/youtube", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();

    if (data.error) {
      alert("❌ " + data.error);
      return;
    }

    alert("✅ +300 Balance added!");

  } catch (err) {
    console.error("YOUTUBE TASK ERROR:", err);
    alert("❌ Network error");
  }
}

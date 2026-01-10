const userId = localStorage.getItem("userId");
const msg = document.getElementById("taskMsg");

async function watchAd() {
  const res = await fetch("/api/task/watch-ad", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();

  if (data.error) {
    msg.innerText = "❌ Already claimed";
    return;
  }

  msg.innerText = "✅ Energy & coins added!";
}

async function completeTask(type) {
  setTimeout(async () => {
    const res = await fetch("/api/task/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, type })
    });

    const data = await res.json();

    if (data.error) {
      msg.innerText = "❌ Task already completed";
      return;
    }

    msg.innerText = "🎉 Reward added!";
  }, 3000); // delay don ya buɗe link
}

const tg = window.Telegram?.WebApp;

if (!tg) {
  document.body.innerHTML = "<h3>❌ Open from Telegram</h3>";
} else {
  tg.ready();

  const user = tg.initDataUnsafe?.user;

  if (!user || !user.id) {
    document.body.innerHTML = "<h3>❌ No Telegram user</h3>";
  } else {
    console.log("Telegram ID:", user.id);
    document.getElementById("balance").innerText =
      "Balance: loading...";
  }
}

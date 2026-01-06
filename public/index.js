function openStats() {
  window.location.href = "/stats.html";
}

function openBurns() {
  window.location.href = "/burn.html";
}

function openLeaderboard() {
  window.location.href = "/leaderboard.html";
}

function joinTelegram(e) {
  e.preventDefault(); // ⛔ hana auto back

  window.open(
    "https://t.me/teletechai_bot",
    "_blank"
  );
}

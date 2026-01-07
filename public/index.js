function openStats() {
  window.location.href = "/stats.html";
}

function openBurns() {
  window.location.href = "/burn.html";
}

function openLeaderboard() {
  window.location.href = "/leaderboard.html";
}

function joinYouTube(e) {
  e.preventDefault(); // ⛔ hana auto back

  window.open(
    "https://www.youtube.com/@Sunusicrypto",
    "_blank"
  );

  document.getElementById("ytMsg").innerText =
    "✅ Opened YouTube (come back after joining)";
}

function joinGroup(e) {
  e.preventDefault(); // ⛔ hana auto back

  window.open(
    "https://t.me/tele_tap_ai",
    "_blank"
  );

  document.getElementById("groupMsg").innerText =
    "✅ Opened Community Group";
}

function joinChannel(e) {
  e.preventDefault(); // ⛔ hana auto back

  window.open(
    "https://t.me/TeleAIupdates",
    "_blank"
  );

  document.getElementById("channelMsg").innerText =
    "✅ Opened Channel";
}

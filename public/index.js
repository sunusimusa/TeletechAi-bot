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
    "https://youtube.com/@YOUR_CHANNEL",
    "_blank"
  );

  document.getElementById("ytMsg").innerText =
    "✅ Opened YouTube (come back after joining)";
}

function joinGroup(e) {
  e.preventDefault(); // ⛔ hana auto back

  window.open(
    "https://t.me/YOUR_GROUP_LINK",
    "_blank"
  );

  document.getElementById("groupMsg").innerText =
    "✅ Opened Community Group";
}

function joinChannel(e) {
  e.preventDefault(); // ⛔ hana auto back

  window.open(
    "https://t.me/teletechai_bot",
    "_blank"
  );

  document.getElementById("channelMsg").innerText =
    "✅ Opened Channel";
}

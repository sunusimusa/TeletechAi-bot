let enemyHP = 100;
let playerHP = 100;
let lock = false;

function updateBars() {
  document.getElementById("enemyHP").style.width = enemyHP + "%";
  document.getElementById("playerHP").style.width = playerHP + "%";
}

function attack() {
  if (lock) return;
  lock = true;

  enemyHP -= Math.floor(Math.random() * 15) + 5;
  if (enemyHP < 0) enemyHP = 0;

  document.getElementById("enemy").classList.add("hit");
  updateBars();

  setTimeout(() => {
    document.getElementById("enemy").classList.remove("hit");

    if (enemyHP <= 0) {
      alert("🎉 YOU WIN!");
      reset();
      return;
    }

    playerHP -= Math.floor(Math.random() * 10) + 5;
    if (playerHP < 0) playerHP = 0;

    document.getElementById("player").classList.add("hit");
    updateBars();

    setTimeout(() => {
      document.getElementById("player").classList.remove("hit");
      if (playerHP <= 0) alert("💀 YOU LOSE!");
      lock = false;
    }, 300);

  }, 300);
}

function reset() {
  enemyHP = 100;
  playerHP = 100;
  updateBars();
  lock = false;
}

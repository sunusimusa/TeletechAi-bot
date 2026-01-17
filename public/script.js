function playSound(id) {
  const s = document.getElementById(id);
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}

document.addEventListener("click", () => {
  ["winSound", "loseSound"].forEach(id => {
    const s = document.getElementById(id);
    if (s) {
      s.play().then(() => {
        s.pause();
        s.currentTime = 0;
      });
    }
  });
}, { once: true });

function animateBox(box, reward) {
  box.classList.add("opened");

  if (reward > 0) {
    playSound("winSound");
    box.innerText = "+" + reward;
  } else {
    playSound("loseSound");
    box.innerText = "Empty";
  }

  setTimeout(() => {
    box.classList.remove("opened");
    box.innerText = "OPEN BOX";
  }, 1000);
}

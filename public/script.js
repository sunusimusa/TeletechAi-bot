let userId = localStorage.getItem("uid");

if (!userId) {
  userId = Math.floor(Math.random() * 999999);
  localStorage.setItem("uid", userId);
}

async function loadUser() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;

  document.getElementById("refLink").value =
    window.location.origin + "?ref=" + userId;
}

async function tap() {
  const circle = document.getElementById("tapBtn");

  // animation start
  circle.classList.add("active");

  setTimeout(() => {
    circle.classList.remove("active");
  }, 150);

  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
}
function copyLink() {
  navigator.clipboard.writeText(
    window.location.origin + "?ref=" + userId
  );
  alert("Link copied!");
}
loadUser();

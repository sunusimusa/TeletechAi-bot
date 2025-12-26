const userId = "demo-user";

async function loadUser() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  document.getElementById("balance").innerText = data.balance;
}

async function tap() {
  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  document.getElementById("balance").innerText = data.balance;
}

loadUser();
// ==========================
// USER ID (AUTO GENERATE)
// ==========================
let userId = localStorage.getItem("uid");

if (!userId) {
  userId = Math.floor(Math.random() * 1000000);
  localStorage.setItem("uid", userId);
}

// ==========================
// LOAD USER DATA
// ==========================
fetch(`/user/${userId}`)
  .then(res => res.json())
  .then(data => {
    document.getElementById("balance").innerText = data.balance;
  });

// ==========================
// TAP FUNCTION
// ==========================
function tap() {
  fetch(`/tap/${userId}`, {
    method: "POST"
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("balance").innerText = data.balance;
    });
}

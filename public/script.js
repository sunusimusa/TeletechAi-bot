// CREATE USER ID
let userId = localStorage.getItem("uid");

if (!userId) {
  userId = "user_" + Math.floor(Math.random() * 1000000000);
  localStorage.setItem("uid", userId);
}

// LOAD BALANCE
async function loadUser() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  document.getElementById("balance").innerText = "Balance: " + data.balance + " TT";
}

// TAP FUNCTION
async function tap() {
  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  document.getElementById("balance").innerText = "Balance: " + data.balance + " TT";
}

window.onload = loadUser;

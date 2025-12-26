let userId = localStorage.getItem("uid");

if (!userId) {
  userId = Math.floor(Math.random() * 1000000);
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
}

async function tap() {
  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();

  if (data.error) {
    alert("⚡ Energy ya ƙare!");
    return;
  }

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
}

loadUser();

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

  document.getElementById("balance").innerText = data.balance + " TT";
  document.getElementById("energy").innerText = data.energy;
}

async function tap() {
  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();

  document.getElementById("balance").innerText = data.balance + " TT";
  document.getElementById("energy").innerText = data.energy;
}

document.getElementById("refLink").value =
  window.location.origin + "?ref=" + userId;

function copyLink() {
  navigator.clipboard.writeText(
    window.location.origin + "?ref=" + userId
  );
  alert("Invite link copied!");
}

loadUser();

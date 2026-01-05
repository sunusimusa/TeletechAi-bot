async function loadBurns() {
  const res = await fetch("/api/stats/burns");
  const data = await res.json();

  const list = document.getElementById("burnList");
  list.innerHTML = "";

  if (!data.burns || data.burns.length === 0) {
    list.innerHTML = "<p>No burns yet</p>";
    return;
  }

  data.burns.forEach(b => {
    const row = document.createElement("div");
    row.className = "burn-item";

    row.innerHTML = `
      <div>
        🔥 Burned <b>${b.amount}</b> TOKEN
        <br/>
        <small>Reason: ${b.reason || "AUTO"}</small>
      </div>
      <div class="burn-date">
        ${new Date(b.createdAt).toLocaleString()}
      </div>
    `;

    list.appendChild(row);
  });
}

loadBurns();

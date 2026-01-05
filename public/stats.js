async function loadSupply() {
  const res = await fetch("/api/stats/supply");
  const data = await res.json();

  document.getElementById("totalSupply").innerText =
    data.totalSupply.toLocaleString();

  document.getElementById("burned").innerText =
    data.burned.toLocaleString();

  document.getElementById("systemBal").innerText =
    data.systemBalance.toLocaleString();

  document.getElementById("circulating").innerText =
    data.circulating.toLocaleString();
}

loadSupply();

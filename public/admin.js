/************************
 * ADMIN DASHBOARD DEMO
 ************************/

const WITHDRAW_KEY = "teletech_withdraws";
const table = document.getElementById("withdrawList");

// load withdraws
let withdraws = JSON.parse(localStorage.getItem(WITHDRAW_KEY)) || [];
render();

function render() {
  table.innerHTML = "";

  if (withdraws.length === 0) {
    table.innerHTML = `<tr><td colspan="5">No withdraw requests</td></tr>`;
    return;
  }

  withdraws.forEach((w, i) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${w.user}</td>
      <td>${w.wallet}</td>
      <td>${w.amount} TT</td>
      <td>${w.status}</td>
      <td>
        <button onclick="approve(${i})">Approve</button>
        <button onclick="reject(${i})">Reject</button>
      </td>
    `;

    table.appendChild(row);
  });
}

// approve
function approve(index) {
  withdraws[index].status = "approved";
  save();
}

// reject
function reject(index) {
  withdraws[index].status = "rejected";
  save();
}

function save() {
  localStorage.setItem(WITHDRAW_KEY, JSON.stringify(withdraws));
  render();
}

// ================================
// BUDGETBUDDY - JavaScript Logic
// ================================

// -------- 1. SELECTORS & GLOBALS --------
const form = document.getElementById("add-transaction-form");
const balanceEl = document.getElementById("current-balance");
const incomeEl = document.getElementById("total-income");
const expenseEl = document.getElementById("total-expense");
const listEl = document.getElementById("transactions-list");
const filterTypeEl = document.getElementById("filter-type");
const searchEl = document.getElementById("transaction-search");
const darkToggle = document.querySelector(".toggle-mode");

let transactions = loadTransactions();
let filterType = "all";
let searchText = "";

// -------- 2. LOCAL STORAGE --------
function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}
function loadTransactions() {
  return JSON.parse(localStorage.getItem("transactions")) || [];
}

// -------- 3. UTILS --------
const formatAmount = amt =>
  (amt > 0 ? "+₹" : "-₹") + Math.abs(amt).toLocaleString();

const makeID = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

const clearForm = () => form.reset();

// -------- 4. ADD TRANSACTION --------
form.addEventListener("submit", e => {
  e.preventDefault();
  const formData = new FormData(form);
  let title = formData.get("title").trim(),
      amount = parseFloat(formData.get("amount")),
      category = formData.get("category"),
      date = formData.get("date"),
      type = formData.get("type");

  if (!title || isNaN(amount) || !category || !date || !type) {
    showToast("Please fill all fields correctly!", "error");
    return;
  }

  // Amount sign: Always negative for expense, positive for income.
  amount = type === "income" ? Math.abs(amount) : -1 * Math.abs(amount);

  const newTx = {
    id: makeID(),
    title,
    amount,
    category,
    date,
    type, // "income" or "expense"
  };

  transactions.push(newTx);
  saveTransactions();
  updateUI();
  clearForm();
  showToast("Transaction added!", "success");
});

// -------- 5. RENDER TRANSACTIONS --------
function renderTransactions(txns) {
  listEl.innerHTML = "";
  if (!txns.length) {
    listEl.innerHTML = `<li class="empty">No transactions to show.</li>`;
    return;
  }
  txns.forEach(tx => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="transaction-title">${tx.title}</span>
      <span class="transaction-amount ${tx.type}">
        ${formatAmount(tx.amount)}
      </span>
      <span class="transaction-category">${tx.category}</span>
      <span class="transaction-date">${tx.date}</span>
      <button class="delete-btn" title="Delete" data-id="${tx.id}">🗑️</button>
    `;
    // Animate on entry
    li.style.opacity = "0";
    setTimeout(() => (li.style.opacity = "1"), 10);
    listEl.appendChild(li);
  });
}

// -------- 6. DELETE TRANSACTION (Event Delegation) --------
listEl.addEventListener("click", e => {
  if (e.target.classList.contains("delete-btn")) {
    const id = e.target.getAttribute("data-id");
    transactions = transactions.filter(tx => tx.id !== id);
    saveTransactions();
    updateUI();
    showToast("Transaction deleted.", "info");
  }
});

// -------- 7. UPDATE TOTALS --------
function updateTotals() {
  const income = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income + expense;

  balanceEl.textContent = "₹" + balance.toLocaleString();
  incomeEl.textContent = "₹" + income.toLocaleString();
  expenseEl.textContent = "₹" + Math.abs(expense).toLocaleString();
}

// -------- 8. FILTER & SEARCH --------
filterTypeEl?.addEventListener("change", e => {
  filterType = e.target.value;
  updateUI();
});
searchEl?.addEventListener("input", e => {
  searchText = e.target.value.trim().toLowerCase();
  updateUI();
});

// -------- 9. Main Update UI --------
function updateUI() {
  let view = [...transactions];
  if (filterType !== "all")
    view = view.filter(tx => tx.type === filterType);
  if (searchText)
    view = view.filter(tx =>
      tx.title.toLowerCase().includes(searchText) ||
      tx.category.toLowerCase().includes(searchText)
    );
  // Sort by most recent
  view.sort((a, b) => new Date(b.date) - new Date(a.date));
  renderTransactions(view);
  updateTotals();
}

// -------- 10. DARK/LIGHT THEME PERSISTENCE --------
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") document.body.classList.add("dark-mode");

darkToggle?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("theme",
    document.body.classList.contains("dark-mode") ? "dark" : "light"
  );
});

// -------- 11. SIMPLE TOAST FUNCTION (optional UI feedback) --------
function showToast(msg, type = "default") {
  // type: "success" "info" "error"
  let toast = document.createElement("div");
  toast.textContent = msg;
  toast.className = "toast " + type;
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "40px",
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    background: type === "error" ? "#e17055"
      : type === "info" ? "#6c5ce7"
      : "#00b894",
    padding: "13px 24px",
    borderRadius: "30px",
    fontWeight: 600,
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: "1em",
    boxShadow: "0 3px 18px #12121218",
    zIndex: 1003,
    opacity: "0",
    transition: "opacity .2s"
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.style.opacity = "1", 16);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 250);
  }, 1500);
}

// -------- 12. LOAD ON BEGIN --------
updateUI();


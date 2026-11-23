/* Ceramic Workshop Manager — all data stored in localStorage on this device. */

const STORAGE_KEY = "ceramic-manager-v2";

const DEFAULT_CATEGORIES = ["Mouad", "Ahmed", "Otman", "Azzeddin", "Gaz", "Breakfast", "Other"];
const DEFAULT_WORKERS = ["Otman", "Azzeddin"].map(name => ({
  id: uid(), name, rate: 130
}));

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

let state = load();
let weekOffset = 0; // 0 = current week, -1 = last week, ...

/* ---------- Storage ---------- */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return {
        workers: s.workers || DEFAULT_WORKERS,
        categories: s.categories || DEFAULT_CATEGORIES,
        attendance: s.attendance || {},     // "workerId|YYYY-MM-DD" -> "in" | "out"
        moneyIn: s.moneyIn || [],
        moneyOut: s.moneyOut || []
      };
    }
  } catch (e) { /* corrupted data: fall through to defaults */ }
  return {
    workers: DEFAULT_WORKERS,
    categories: [...DEFAULT_CATEGORIES],
    attendance: {},
    moneyIn: [],
    moneyOut: []
  };
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* ---------- Dates / week helpers ---------- */
function fmtISO(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function startOfWeek(offset) {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6
  d.setDate(d.getDate() - day + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekDates(offset) {
  const start = startOfWeek(offset);
  return DAYS.map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function fmtDay(d) { return String(d.getDate()).padStart(2, "0"); }
function fmtMonthYear(d) { return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }); }

function dh(n) { return Number(n).toLocaleString("fr-MA") + " DH"; }

/* ---------- Menu / navigation ---------- */
const sidebar = document.getElementById("sidebar");
const scrim = document.getElementById("scrim");

document.getElementById("hamburger").addEventListener("click", () => {
  sidebar.classList.add("open");
  scrim.classList.add("show");
});
scrim.addEventListener("click", closeMenu);
function closeMenu() {
  sidebar.classList.remove("open");
  scrim.classList.remove("show");
}

document.querySelectorAll(".nav-link").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("page-" + btn.dataset.page).classList.add("active");
    closeMenu();
    window.scrollTo(0, 0);
  });
});

/* ---------- Wages page ---------- */
function weekDaysWorked(workerId, offset) {
  const dates = weekDates(offset);
  let count = 0;
  let future = 0;
  const today = fmtISO(new Date());
  dates.forEach(d => {
    const v = state.attendance[workerId + "|" + fmtISO(d)];
    if (v === "in") count++;
    if (fmtISO(d) > today) future++;
  });
  return { count, future };
}

function renderWages() {
  const dates = weekDates(0);
  document.getElementById("wages-week-label").textContent =
    "Week of " + fmtDay(dates[0]) + " – " + fmtDay(dates[6]) + " " + fmtMonthYear(dates[6]);

  const wrap = document.getElementById("wage-cards");
  wrap.innerHTML = "";

  let total = 0, totalDays = 0;

  state.workers.forEach(w => {
    const { count, future } = weekDaysWorked(w.id, 0);
    const pay = count * w.rate;
    total += pay;
    totalDays += count;

    const card = document.createElement("div");
    card.className = "card wage-card";
    card.innerHTML =
      "<h3>" + escapeHtml(w.name) + "</h3>" +
      '<label class="rate-edit">DH / day' +
      '<input class="rate-input" type="number" min="0" step="1" value="' + w.rate + '" aria-label="Daily rate for ' + escapeHtml(w.name) + '"></label>' +
      '<span class="amount">' + dh(pay) + "</span>" +
      '<span class="days">' + count + " day(s) worked" +
        (future ? " · " + future + " day(s) left this week" : "") + "</span>" +
      '<button class="remove" type="button">Remove worker</button>';

    card.querySelector(".rate-input").addEventListener("change", e => {
      const v = Math.round(Number(e.target.value));
      if (!isNaN(v) && v >= 0) {
        w.rate = v;
        save();
        renderAll();
      }
    });

    card.querySelector(".remove").addEventListener("click", () => {
      if (!confirm("Remove " + w.name + "? Attendance history stays but the worker disappears from the lists.")) return;
      state.workers = state.workers.filter(x => x.id !== w.id);
      save();
      renderAll();
    });
    wrap.appendChild(card);
  });

  document.getElementById("wages-total").textContent = dh(total);
  document.getElementById("wages-count").textContent = state.workers.length;
  document.getElementById("wages-days").textContent = totalDays;
}

document.getElementById("worker-form").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("worker-name").value.trim();
  const rate = Number(document.getElementById("worker-rate").value);
  if (!name) return;
  state.workers.push({ id: uid(), name, rate: rate || 130 });
  save();
  e.target.reset();
  document.getElementById("worker-rate").value = 130;
  renderAll();
});

/* ---------- Attendance page ---------- */
function renderAttendance() {
  const dates = weekDates(weekOffset);
  const start = dates[0], end = dates[6];
  const todayISO = fmtISO(new Date());

  document.getElementById("att-week-label").textContent =
    "Tap once for ✓ (came), again for ✗ (absent), again to clear.";
  document.getElementById("att-week-title").textContent =
    fmtDay(start) + " – " + fmtDay(end) + " " + fmtMonthYear(end);

  const head = document.getElementById("att-head");
  head.innerHTML = "<tr><th style='text-align:left'>Worker</th>" +
    dates.map(d =>
      "<th>" + DAYS[(d.getDay() + 6) % 7] + "<small>" + fmtDay(d) + "/" + String(d.getMonth() + 1).padStart(2, "0") + "</small></th>"
    ).join("") +
    "<th>Days</th></tr>";

  const body = document.getElementById("att-body");
  body.innerHTML = "";

  if (state.workers.length === 0) {
    body.innerHTML = '<tr><td colspan="9" class="empty">No workers yet — add one on the Wages page.</td></tr>';
    return;
  }

  state.workers.forEach(w => {
    const tr = document.createElement("tr");
    let count = 0;

    const nameTd = document.createElement("td");
    nameTd.className = "worker-name";
    nameTd.innerHTML = escapeHtml(w.name) + "<small>" + dh(w.rate) + " / day</small>";
    tr.appendChild(nameTd);

    dates.forEach(d => {
      const iso = fmtISO(d);
      const key = w.id + "|" + iso;
      const v = state.attendance[key];
      if (v === "in") count++;

      const td = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mark-btn" + (v === "in" ? " present" : v === "out" ? " absent" : "") + (iso === todayISO ? " today" : "");
      btn.textContent = v === "in" ? "✓" : v === "out" ? "✗" : "";
      btn.setAttribute("aria-label", w.name + " " + iso + (v === "in" ? ": came" : v === "out" ? ": absent" : ": not marked"));
      btn.addEventListener("click", () => {
        state.attendance[key] = state.attendance[key] === "in" ? "out" : state.attendance[key] === "out" ? undefined : "in";
        if (state.attendance[key] === undefined) delete state.attendance[key];
        save();
        renderAttendance();
        renderWages();
      });
      td.appendChild(btn);
      tr.appendChild(td);
    });

    const countTd = document.createElement("td");
    countTd.className = "days-count";
    countTd.textContent = count;
    tr.appendChild(countTd);

    body.appendChild(tr);
  });
}

document.getElementById("prev-week").addEventListener("click", () => { weekOffset--; renderAttendance(); });
document.getElementById("next-week").addEventListener("click", () => { weekOffset++; renderAttendance(); });

/* ---------- Money in / out ---------- */
function renderMoney() {
  const sumIn = state.moneyIn.reduce((a, e) => a + e.amount, 0);
  const sumOut = state.moneyOut.reduce((a, e) => a + e.amount, 0);

  document.getElementById("sum-in").textContent = dh(sumIn);
  document.getElementById("sum-out").textContent = dh(sumOut);
  document.getElementById("sum-bal").textContent = dh(sumIn - sumOut);

  const select = document.getElementById("out-category");
  const current = select.value;
  select.innerHTML = state.categories
    .map(c => "<option>" + escapeHtml(c) + "</option>").join("");
  if (state.categories.includes(current)) select.value = current;

  const chips = document.getElementById("category-chips");
  chips.innerHTML = state.categories
    .map(c => '<span class="chip">' + escapeHtml(c) +
      '<button type="button" data-cat="' + escapeHtml(c) + '" aria-label="Remove category ' + escapeHtml(c) + '">×</button></span>')
    .join("");
  chips.querySelectorAll("button").forEach(b =>
    b.addEventListener("click", () => {
      const c = b.dataset.cat;
      const used = state.moneyOut.some(e => e.category === c);
      if (used && !confirm("Category \"" + c + "\" already has entries. Remove it anyway? Entries keep the category name.")) return;
      state.categories = state.categories.filter(x => x !== c);
      save();
      renderMoney();
    })
  );

  renderList("in-list", state.moneyIn, "in");
  renderList("out-list", state.moneyOut, "out");
}

function renderList(id, entries, kind) {
  const ul = document.getElementById(id);
  ul.innerHTML = "";
  if (entries.length === 0) {
    ul.innerHTML = '<li class="empty">No entries yet.</li>';
    return;
  }
  [...entries].reverse().forEach(e => {
    const li = document.createElement("li");
    li.innerHTML =
      "<span>" + (kind === "out" ? escapeHtml(e.category) : "Alhaj") +
        (e.note ? ' <span class="note">— ' + escapeHtml(e.note) + "</span>" : "") +
        ' <span class="note">· ' + e.date + "</span></span>" +
      '<span style="display:flex;align-items:center;gap:10px">' +
      '<span class="val ' + kind + '">' + (kind === "in" ? "+" : "−") + " " + dh(e.amount) + "</span>" +
      '<button class="del" type="button" aria-label="Delete entry">🗑</button></span>';
    li.querySelector(".del").addEventListener("click", () => {
      const arr = kind === "in" ? state.moneyIn : state.moneyOut;
      const i = arr.indexOf(e);
      if (i > -1) arr.splice(i, 1);
      save();
      renderMoney();
    });
    ul.appendChild(li);
  });
}

document.getElementById("in-form").addEventListener("submit", e => {
  e.preventDefault();
  const amount = Number(document.getElementById("in-amount").value);
  if (!amount) return;
  state.moneyIn.push({ id: uid(), amount, note: document.getElementById("in-note").value.trim(), date: fmtISO(new Date()) });
  save();
  e.target.reset();
  renderMoney();
});

document.getElementById("out-form").addEventListener("submit", e => {
  e.preventDefault();
  const amount = Number(document.getElementById("out-amount").value);
  if (!amount) return;
  state.moneyOut.push({
    id: uid(),
    category: document.getElementById("out-category").value,
    amount,
    note: document.getElementById("out-note").value.trim(),
    date: fmtISO(new Date())
  });
  save();
  e.target.reset();
  renderMoney();
});

document.getElementById("cat-form").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("cat-name").value.trim();
  if (!name) return;
  if (!state.categories.some(c => c.toLowerCase() === name.toLowerCase())) {
    state.categories.push(name);
    save();
  }
  document.getElementById("cat-name").value = "";
  renderMoney();
});

/* ---------- Utils ---------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderAll() {
  renderWages();
  renderAttendance();
  renderMoney();
}

renderAll();

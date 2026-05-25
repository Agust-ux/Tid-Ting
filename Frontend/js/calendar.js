let currentDate = new Date();
let projects = [];

const calendar = document.getElementById("calendar");
const timelines = document.getElementById("timelines");
const monthLabel = document.getElementById("monthLabel");

function toDateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDate(str) {
  return toDateOnly(new Date(str));
}

function getMonthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;

  const days = [];

  for (let i = 0; i < 42; i++) {
    const dayNum = i - startOffset + 1;
    const date = new Date(year, month, dayNum);

    days.push({
      date,
      key: date.toISOString().split("T")[0],
      inMonth: date.getMonth() === month
    });
  }

  return days;
}

function makeTransparent(color, alpha) {
  if (color.startsWith("rgba")) {
    return color.replace(/rgba\(([^)]+),[\d.]+\)/, `rgba($1,${alpha})`);
  }

  if (color.startsWith("rgb")) {
    return color.replace("rgb", "rgba").replace(")", `,${alpha})`);
  }

  if (color.startsWith("#")) {
    let hex = color.replace("#", "");

    if (hex.length === 3) {
      hex = hex.split("").map(x => x + x).join("");
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r},${g},${b},${alpha})`;
  }

  return color;
}

async function loadProjects() {
  const res = await fetch("http://localhost:3007/api/projects");
  const data = await res.json();

  projects = data.map(p => ({
    id: p.id,
    title: p.title,
    start: parseDate(p.start_date),
    end: parseDate(p.end_date),
    color: p.color,
    notes: p.description
  }));
}

function renderCalendar() {
  calendar.innerHTML = "";
  timelines.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthLabel.textContent =
    currentDate.toLocaleString("default", { month: "long" }) + " " + year;

  const days = getMonthMatrix(year, month);

  const cells = [];

  const weekdays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  weekdays.forEach(d => {
    const el = document.createElement("div");
    el.className = "weekday";
    el.textContent = d;
    calendar.appendChild(el);
  });

  days.forEach((d, i) => {
    const cell = document.createElement("div");
    cell.className = "day";

    if (d.inMonth) {
      cell.textContent = d.date.getDate();
    }

    cell.dataset.date = d.key;
    calendar.appendChild(cell);
    cells.push({ el: cell, date: d.date, index: i });
  });

  renderTimelines(cells);
}

function renderTimelines(cells) {

  const cellMap = new Map();
  cells.forEach(c => cellMap.set(c.date.toDateString(), c));

  projects.forEach(p => {

    const start = toDateOnly(p.start);
    const end = toDateOnly(p.end);

    const activeCells = cells.filter(c =>
      c.date >= start && c.date <= end
    );

    if (!activeCells.length) return;

    const groups = {};

    activeCells.forEach(c => {
      const week = Math.floor(c.index / 7);
      if (!groups[week]) groups[week] = [];
      groups[week].push(c);
    });

    Object.values(groups).forEach(group => {

      const first = group[0];
      const last = group[group.length - 1];

      const bar = document.createElement("div");
      bar.className = "timeline";
      bar.style.background = makeTransparent(p.color, 0.5);

      const firstRect = first.el.getBoundingClientRect();
      const calendarRect = calendar.getBoundingClientRect();

      const topOffset = first.el.offsetTop;

      bar.style.left = first.el.offsetLeft + "px";
      bar.style.top = topOffset + 30 + "px";
      bar.style.width =
        (last.el.offsetLeft + last.el.offsetWidth - first.el.offsetLeft) + "px";

      bar.onclick = (e) => {
        e.stopPropagation();
        alert(p.title);
      };

      timelines.appendChild(bar);
    });

  });
}

function goPrevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  init();
}

function goNextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  init();
}

async function init() {
  await loadProjects();
  renderCalendar();
}

document.getElementById("prevMonth").onclick = goPrevMonth;
document.getElementById("nextMonth").onclick = goNextMonth;

init();
let currentDate = new Date();
let projects = [];

// =========================
// DOM REFERENCES
// =========================

const calendar = document.getElementById("calendar");
const timelines = document.getElementById("timelines");
const monthLabel = document.getElementById("monthLabel");

// =========================
// DATE UTILITIES
// =========================

/**
 * Normalizes a date to midnight (removes time component)
 */
function toDateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Safely parses backend date strings into Date objects
 */
function parseDate(str) {
  if (!str) return null;

  const d = new Date(str);
  if (isNaN(d)) return null;

  return toDateOnly(d);
}

// =========================
// CALENDAR GENERATION
// =========================

/**
 * Builds a 6-week calendar grid (42 cells)
 * including overflow days from previous/next month
 */
function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1);

  // Align Monday as first day of week
  const startOffset = (firstDay.getDay() + 6) % 7;

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

// =========================
// COLOR HANDLING
// =========================

/**
 * Converts hex/rgb/rgba colors into transparent rgba version
 * used for timeline bars
 */
function makeTransparent(color, alpha) {
  if (!color) return `rgba(0,0,0,${alpha})`;

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

// =========================
// DATA LOADING
// =========================

/**
 * Fetches projects from backend and normalizes them
 */
async function loadProjects() {
  try {
    const res = await fetch("http://localhost:3007/api/projects");
    const data = await res.json();

    projects = data
      .filter(p => p.start_date && p.end_date)
      .map(p => ({
        id: p.id,
        title: p.title,
        start: parseDate(p.start_date),
        end: parseDate(p.end_date),
        color: p.color || "#74ca63",
        notes: p.description || ""
      }))
      .filter(p => p.start && p.end);

  } catch (err) {
    console.error("Failed to load projects:", err);
    projects = [];
  }
}

// =========================
// CALENDAR RENDERING
// =========================

/**
 * Renders calendar grid and weekday headers
 */
function renderCalendar() {
  calendar.innerHTML = "";
  timelines.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthLabel.textContent =
    currentDate.toLocaleString("default", { month: "long" }) +
    " " +
    year;

  const days = getMonthMatrix(year, month);

  // Weekday headers
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  weekdays.forEach(d => {
    const el = document.createElement("div");
    el.className = "weekday";
    el.textContent = d;
    calendar.appendChild(el);
  });

  // Calendar cells
  const cells = [];

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

// =========================
// TIMELINE RENDERING
// =========================

/**
 * Renders project timelines inside the calendar grid.
 * Each timeline is clipped to the visible month range.
 */
function renderTimelines(cells) {

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  projects.forEach(p => {

    const start = p.start;
    const end = p.end;

    // Skip projects completely outside current month
    if (end < monthStart || start > monthEnd) return;

    // Clip project range to visible month
    const visibleStart = start < monthStart ? monthStart : start;
    const visibleEnd = end > monthEnd ? monthEnd : end;

    const activeCells = cells.filter(c =>
      c.date >= visibleStart && c.date <= visibleEnd
    );

    if (!activeCells.length) return;

    // Group cells by week row
    const groups = {};

    activeCells.forEach(c => {
      const week = Math.floor(c.index / 7);
      if (!groups[week]) groups[week] = [];
      groups[week].push(c);
    });

    // Create timeline bars per week group
    Object.values(groups).forEach(group => {

      const first = group[0];
      const last = group[group.length - 1];

      const bar = document.createElement("div");
      bar.className = "timeline";
      bar.style.background = makeTransparent(p.color, 0.55);

      bar.style.left = first.el.offsetLeft + "px";
      bar.style.top = first.el.offsetTop + 30 + "px";
      bar.style.width =
        (last.el.offsetLeft + last.el.offsetWidth - first.el.offsetLeft) + "px";

      bar.title = p.title;

      bar.onclick = (e) => {
        e.stopPropagation();
        window.location.href = `/project.html?id=${p.id}`;
      };

      timelines.appendChild(bar);
    });
  });
}

// =========================
// NAVIGATION
// =========================

function goPrevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  init();
}

function goNextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  init();
}

// =========================
// INITIALIZATION
// =========================

async function init() {
  await loadProjects();
  renderCalendar();
}

// Event bindings
document.getElementById("prevMonth").onclick = goPrevMonth;
document.getElementById("nextMonth").onclick = goNextMonth;

// Start app
init();
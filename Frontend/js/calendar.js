let currentDate = new Date();
let projects = [];

const calendar = document.getElementById("calendar");
const timelines = document.getElementById("timelines");
const monthLabel = document.getElementById("monthLabel");

// =========================
// DATE HELPERS (FIXED)
// =========================

function toDateOnly(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDate(str) {
    if (!str) return null;
    const d = new Date(str);
    if (isNaN(d)) return null;
    return toDateOnly(d);
}

// =========================
// CALENDAR MATRIX
// =========================

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

// =========================
// COLOR UTILITY (SAFE)
// =========================

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
// LOAD PROJECTS (ROBUST)
// =========================

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
                notes: p.description
            }))
            .filter(p => p.start && p.end);

    } catch (err) {
        console.error("Failed to load projects:", err);
        projects = [];
    }
}

// =========================
// CALENDAR RENDER
// =========================

function renderCalendar() {
    calendar.innerHTML = "";
    timelines.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthLabel.textContent =
        currentDate.toLocaleString("default", { month: "long" }) + " " + year;

    const days = getMonthMatrix(year, month);

    const cells = [];

    // weekdays
    const weekdays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

    weekdays.forEach(d => {
        const el = document.createElement("div");
        el.className = "weekday";
        el.textContent = d;
        calendar.appendChild(el);
    });

    // days
    days.forEach((d, i) => {
        const cell = document.createElement("div");
        cell.className = "day";

        if (d.inMonth) cell.textContent = d.date.getDate();

        cell.dataset.date = d.key;

        calendar.appendChild(cell);
        cells.push({ el: cell, date: d.date, index: i });
    });

    renderTimelines(cells);
}

// =========================
// TIMELINE RENDER (FIXED LOGIC)
// =========================

function renderTimelines(cells) {

    projects.forEach(p => {
        if (!p.start || !p.end) return;

        const start = p.start;
        const end = p.end;

        const active = cells.filter(c =>
            c.date >= start && c.date <= end
        );

        if (active.length === 0) return;

        // group by week row
        const groups = {};

        active.forEach(c => {
            const week = Math.floor(c.index / 7);
            if (!groups[week]) groups[week] = [];
            groups[week].push(c);
        });

        Object.values(groups).forEach(group => {

            const first = group[0];
            const last = group[group.length - 1];

            const bar = document.createElement("div");
            bar.className = "timeline";
            bar.style.background = makeTransparent(p.color, 0.55);

            const left = first.el.offsetLeft;
            const width =
                last.el.offsetLeft + last.el.offsetWidth - first.el.offsetLeft;

            bar.style.left = left + "px";
            bar.style.top = first.el.offsetTop + 30 + "px";
            bar.style.width = width + "px";

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
// INIT
// =========================

async function init() {
    await loadProjects();
    renderCalendar();
}

document.getElementById("prevMonth").onclick = goPrevMonth;
document.getElementById("nextMonth").onclick = goNextMonth;

init();
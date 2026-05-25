/**
 * =========================
 * CALENDAR APPLICATION (LEVEL 6 CLEAN FIXED)
 * =========================
 * Responsibilities:
 * - Render calendar grid
 * - Render project timelines (no duplication bugs)
 * - Sync projects with backend
 * - Maintain stable rendering lifecycle
 */

/* =========================
   STATE
========================= */

let currentDate = new Date();
let projects = [];

/* =========================
   DOM
========================= */

const calendar = document.getElementById("calendar");
const timelines = document.getElementById("timelines");
const monthLabel = document.getElementById("monthLabel");

const modal = document.getElementById("modal");
const addProjectBtn = document.getElementById("addProject");
const saveProjectBtn = document.getElementById("saveProject");
const closeModalBtn = document.getElementById("closeModal");

const titleInput = document.getElementById("titleInput");
const startInput = document.getElementById("startInput");
const endInput = document.getElementById("endInput");
const colorInput = document.getElementById("colorInput");
const notesInput = document.getElementById("notesInput");

/* =========================
   API
========================= */

const API = {
    getProjects: async () => {
        const res = await fetch("http://localhost:3007/api/projects");
        return await res.json();
    },

    createProject: async (data) => {
        const res = await fetch("http://localhost:3007/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        return await res.json();
    }
};

/* =========================
   DATE HELPERS
========================= */

function toDateOnly(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDate(str) {
    return toDateOnly(new Date(str));
}

/* =========================
   CALENDAR GRID
========================= */

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

/* =========================
   COLOR UTIL
========================= */

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

/* =========================
   LOAD PROJECTS
========================= */

async function loadProjects() {
    const data = await API.getProjects();

    projects = data.map(p => ({
        id: p.id,
        title: p.title,
        start: parseDate(p.start_date),
        end: parseDate(p.end_date),
        color: p.color,
        notes: p.description
    }));
}

/* =========================
   RENDER CALENDAR
========================= */

function renderCalendar() {
    calendar.innerHTML = "";
    timelines.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthLabel.textContent =
        currentDate.toLocaleString("default", { month: "long" }) + " " + year;

    const days = getMonthMatrix(year, month);

    const cells = [];

    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

/* =========================
   TIMELINES (FIXED - NO DUPLICATES)
========================= */

function renderTimelines(cells) {
    const weekMap = new Map();

    // =========================
    // STEP 1: build proper week buckets
    // =========================
    projects.forEach(project => {
        const start = toDateOnly(project.start);
        const end = toDateOnly(project.end);

        const activeCells = cells.filter(c =>
            c.date >= start && c.date <= end
        );

        if (!activeCells.length) return;

        activeCells.forEach(cell => {
            const weekIndex = Math.floor(cell.index / 7);

            if (!weekMap.has(weekIndex)) {
                weekMap.set(weekIndex, new Map());
            }

            const projectMap = weekMap.get(weekIndex);

            if (!projectMap.has(project.id)) {
                projectMap.set(project.id, new Set());
            }

            projectMap.get(project.id).add(cell);
        });
    });

    timelines.innerHTML = "";

    // =========================
    // STEP 2: render with STABLE LAYOUT
    // =========================
    weekMap.forEach((projectMap) => {

        let lane = 0;
        const laneHeight = 22; // prevents overlap stacking

        projectMap.forEach((cellsSet, projectId) => {

            const project = projects.find(p => p.id === projectId);
            if (!project) return;

            const cellsArr = Array.from(cellsSet)
                .sort((a, b) => a.index - b.index);

            const first = cellsArr[0];
            const last = cellsArr[cellsArr.length - 1];

            const bar = document.createElement("div");
            bar.className = "timeline";

            // correct color
            bar.style.background = makeTransparent(project.color, 0.5);

            // position fix (NO DUPLICATES + stable stacking)
            const baseTop = first.el.offsetTop;

            bar.style.left = first.el.offsetLeft + "px";
            bar.style.top = (baseTop + 32 + lane * laneHeight) + "px";

            bar.style.width =
                (last.el.offsetLeft + last.el.offsetWidth - first.el.offsetLeft) + "px";

            bar.onclick = () => {
                alert(project.title);
            };

            timelines.appendChild(bar);

            lane++; // stack inside same week safely
        });
    });
}

/* =========================
   MODAL
========================= */

addProjectBtn.onclick = () => {
    modal.classList.remove("hidden");

    titleInput.value = "";
    startInput.value = "";
    endInput.value = "";
    colorInput.value = "#4F8EF7";
    notesInput.value = "";
};

closeModalBtn.onclick = () => {
    modal.classList.add("hidden");
};

/* =========================
   CREATE PROJECT
========================= */

saveProjectBtn.onclick = async () => {
    if (!titleInput.value || !startInput.value || !endInput.value) {
        alert("Please fill required fields");
        return;
    }

    await API.createProject({
        title: titleInput.value,
        description: notesInput.value,
        color: colorInput.value,
        start_date: startInput.value,
        end_date: endInput.value
    });

    modal.classList.add("hidden");

    await init();
};

/* =========================
   NAV
========================= */

document.getElementById("prevMonth").onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    init();
};

document.getElementById("nextMonth").onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    init();
};

/* =========================
   INIT (SAFE)
========================= */

async function init() {
    await loadProjects();
    renderCalendar();
}

init();
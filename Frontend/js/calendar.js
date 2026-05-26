let currentDate = new Date();

let projects = [];

let editingProjectId = null;

/* =========================
   DOM
========================= */

const calendar =
    document.getElementById("calendar");

const timelines =
    document.getElementById("timelines");

const monthLabel =
    document.getElementById("monthLabel");

const modal =
    document.getElementById("modal");

const addProjectBtn =
    document.getElementById("addProject");

const saveProjectBtn =
    document.getElementById("saveProject");

const closeModalBtn =
    document.getElementById("closeModal");

const deleteProjectBtn =
    document.getElementById("deleteProject");

const goToProjectBtn =
    document.getElementById("goToProject");

const titleInput =
    document.getElementById("titleInput");

const startInput =
    document.getElementById("startInput");

const endInput =
    document.getElementById("endInput");

const colorInput =
    document.getElementById("colorInput");

const notesInput =
    document.getElementById("notesInput");

/* =========================
   API
========================= */

const API = {

    async getProjects() {

        const res = await fetch(
            "http://localhost:3007/api/projects"
        );

        return await res.json();
    },

    async createProject(data) {

        await fetch(
            "http://localhost:3007/api/projects",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }
        );
    },

    async updateProject(id, data) {

        await fetch(
            `http://localhost:3007/api/projects/${id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }
        );
    },

    async deleteProject(id) {

        await fetch(
            `http://localhost:3007/api/projects/${id}`,
            {
                method: "DELETE"
            }
        );
    }
};

/* =========================
   HELPERS
========================= */

function toDateOnly(d) {

    return new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
    );
}

function parseDate(str) {

    return toDateOnly(
        new Date(str)
    );
}

function makeTransparent(hex, alpha) {

    hex = hex.replace("#", "");

    const r =
        parseInt(hex.substring(0,2),16);

    const g =
        parseInt(hex.substring(2,4),16);

    const b =
        parseInt(hex.substring(4,6),16);

    return `rgba(${r},${g},${b},${alpha})`;
}

/* =========================
   LOAD
========================= */

async function loadProjects() {

    const data =
        await API.getProjects();

    projects = data.map(project => ({

        id: Number(project.id),

        title: project.title,

        description:
            project.description || "",

        color:
            project.color || "#4F8EF7",

        start:
            parseDate(project.start_date),

        end:
            parseDate(project.end_date)
    }));
}

/* =========================
   CALENDAR MATRIX
========================= */

function getMonthMatrix(year, month) {

    const first =
        new Date(year, month, 1);

    const startOffset =
        (first.getDay() + 6) % 7;

    const daysInMonth =
        new Date(year, month + 1, 0)
            .getDate();

    const totalCells =
        Math.ceil(
            (startOffset + daysInMonth) / 7
        ) * 7;

    const days = [];

    for (let i = 0; i < totalCells; i++) {

        const dayNum =
            i - startOffset + 1;

        const date =
            new Date(year, month, dayNum);

        days.push({

            date,

            inMonth:
                date.getMonth() === month
        });
    }

    return days;
}

/* =========================
   RENDER CALENDAR
========================= */

function renderCalendar() {

    calendar.innerHTML = "";
    timelines.innerHTML = "";

    const year =
        currentDate.getFullYear();

    const month =
        currentDate.getMonth();

    monthLabel.textContent =
        currentDate.toLocaleString(
            "default",
            { month: "long" }
        ) + " " + year;

    const weekdays = [
        "MON","TUE","WED",
        "THU","FRI","SAT","SUN"
    ];

    weekdays.forEach(day => {

        const el =
            document.createElement("div");

        el.className = "weekday";

        el.textContent = day;

        calendar.appendChild(el);
    });

    const days =
        getMonthMatrix(year, month);

    const cells = [];

    days.forEach((d, index) => {

        const cell =
            document.createElement("div");

        cell.className = "day";

        if (d.inMonth) {
            cell.textContent =
                d.date.getDate();
        }

        calendar.appendChild(cell);

        cells.push({
            el: cell,
            date: d.date,
            index
        });
    });

    renderTimelines(cells);
}

/* =========================
   TIMELINES
========================= */

function renderTimelines(cells) {

    timelines.innerHTML = "";

    const weekMap = new Map();

    // =========================
    // GROUP PROJECTS PER WEEK
    // =========================

    projects.forEach(project => {

        const activeCells = cells.filter(cell =>
            cell.date >= project.start &&
            cell.date <= project.end &&
            cell.el.textContent !== ""
        );

        if (!activeCells.length) {
            return;
        }

        activeCells.forEach(cell => {

            const weekIndex =
                Math.floor(cell.index / 7);

            if (!weekMap.has(weekIndex)) {
                weekMap.set(weekIndex, []);
            }

            const rows = weekMap.get(weekIndex);

            let existingRow = rows.find(
                r => r.project.id === project.id
            );

            if (!existingRow) {

                existingRow = {
                    project,
                    cells: []
                };

                rows.push(existingRow);
            }

            existingRow.cells.push(cell);
        });
    });

    // =========================
    // RENDER TIMELINES
    // =========================

    weekMap.forEach(rows => {

        rows.forEach((row, laneIndex) => {

            const sortedCells =
                row.cells.sort(
                    (a, b) => a.index - b.index
                );

            const first = sortedCells[0];
            const last =
                sortedCells[
                    sortedCells.length - 1
                ];

            const timeline =
                document.createElement("div");

            timeline.className = "timeline";

            // =========================
            // COLOR
            // =========================

            timeline.style.background =
                makeTransparent(
                    row.project.color,
                    0.45
                );

            // =========================
            // POSITIONING FIX
            // =========================

            const startX =
                first.el.offsetLeft + 1;

            const endX =
                last.el.offsetLeft +
                last.el.offsetWidth - 1;

            timeline.style.left =
                startX + "px";

            timeline.style.width =
                (endX - startX) + "px";

            // move lower inside cells
            timeline.style.top =
                (
                    first.el.offsetTop +
                    44 +
                    laneIndex * 24
                ) + "px";

            // =========================
            // TEXT
            // =========================

            timeline.textContent =
                row.project.title;

            timeline.style.color = "black";

            // =========================
            // CLICK → EDIT MODAL
            // =========================

            timeline.addEventListener(
                "click",
                () => openEditModal(row.project)
            );

            timelines.appendChild(timeline);
        });
    });
}

/* =========================
   MODAL
========================= */

function resetModal() {

    editingProjectId = null;

    titleInput.value = "";
    startInput.value = "";
    endInput.value = "";
    notesInput.value = "";

    colorInput.value = "#4F8EF7";

    deleteProjectBtn.classList.add("hidden");

    goToProjectBtn.classList.add("hidden");
}

function openCreateModal() {

    resetModal();

    modal.classList.remove("hidden");
}

function openEditModal(project) {

    editingProjectId = project.id;

    titleInput.value = project.title;

    startInput.value =
        project.start
            .toISOString()
            .split("T")[0];

    endInput.value =
        project.end
            .toISOString()
            .split("T")[0];

    notesInput.value =
        project.description;

    colorInput.value =
        project.color;

    deleteProjectBtn.classList.remove("hidden");

    goToProjectBtn.classList.remove("hidden");

    modal.classList.remove("hidden");
}

function closeModal() {

    modal.classList.add("hidden");
}

/* =========================
   SAVE
========================= */

saveProjectBtn.addEventListener(
    "click",
    async () => {

        const data = {

            title:
                titleInput.value,

            description:
                notesInput.value,

            color:
                colorInput.value,

            start_date:
                startInput.value,

            end_date:
                endInput.value
        };

        if (editingProjectId) {

            await API.updateProject(
                editingProjectId,
                data
            );

        } else {

            await API.createProject(data);
        }

        closeModal();

        await init();
    }
);

/* =========================
   DELETE
========================= */

deleteProjectBtn.addEventListener(
    "click",
    async () => {

        if (!editingProjectId) return;

        await API.deleteProject(
            editingProjectId
        );

        closeModal();

        await init();
    }
);

/* =========================
   GO TO PROJECT
========================= */

goToProjectBtn.addEventListener(
    "click",
    () => {

        if (!editingProjectId) return;

        window.location.href =
            `project.html?id=${editingProjectId}`;
    }
);

/* =========================
   NAVIGATION
========================= */

addProjectBtn.addEventListener(
    "click",
    openCreateModal
);

closeModalBtn.addEventListener(
    "click",
    closeModal
);

document
    .getElementById("prevMonth")
    .addEventListener(
        "click",
        async () => {

            currentDate.setMonth(
                currentDate.getMonth() - 1
            );

            await init();
        }
    );

document
    .getElementById("nextMonth")
    .addEventListener(
        "click",
        async () => {

            currentDate.setMonth(
                currentDate.getMonth() + 1
            );

            await init();
        }
    );

/* =========================
   INIT
========================= */

async function init() {

    await loadProjects();

    renderCalendar();
}

init();
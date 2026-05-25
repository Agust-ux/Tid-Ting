/**
 * =========================================
 * PROJECT DASHBOARD (LEVEL 6 CLEAN VERSION)
 * -----------------------------------------
 * - Fixed duplicate DOM append bug
 * - Fixed unstable menu event listeners
 * - Improved code structure (API + UI separation)
 * - Stable delete/edit handling
 * - Cleaner event lifecycle
 * =========================================
 */

let editingProjectId = null;

// =========================
// DOM ELEMENTS
// =========================
const projectModal = document.getElementById("projectModal");
const openProjectModal = document.getElementById("openProjectModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveProjectBtn = document.getElementById("saveProjectBtn");
const projectGrid = document.getElementById("projectGrid");

const projectTitle = document.getElementById("projectTitle");
const projectDescription = document.getElementById("projectDescription");
const projectStart = document.getElementById("projectStart");
const projectEnd = document.getElementById("projectEnd");
const projectColor = document.getElementById("projectColor");

// =========================
// MODAL OPEN (NEW PROJECT)
// =========================
openProjectModal.addEventListener("click", () => {
    editingProjectId = null;

    document.getElementById("modalTitle").textContent = "Nytt prosjekt";

    projectTitle.value = "";
    projectDescription.value = "";
    projectStart.value = "";
    projectEnd.value = "";
    projectColor.value = "#4F8EF7";

    projectModal.classList.remove("hidden");
});

// =========================
// MODAL CLOSE
// =========================
closeModalBtn.addEventListener("click", () => {
    projectModal.classList.add("hidden");
});

// =========================
// API - LOAD PROJECTS
// =========================
async function loadProjects() {
    try {
        const res = await fetch("http://localhost:3007/api/projects");
        const projects = await res.json();

        projectGrid.innerHTML = "";

        projects.forEach(project => {
            const card = createProjectCard(project);
            projectGrid.appendChild(card); // FIX: ONLY ONCE
        });

    } catch (err) {
        console.error("Failed to load projects:", err);
    }
}

// =========================
// CREATE PROJECT CARD
// =========================
function createProjectCard(project) {
    const card = document.createElement("div");
    card.className = "project-card";
    card.style.borderLeft = `12px solid ${project.color}`;

    const startDate = project.start_date
        ? project.start_date.split("T")[0]
        : "";

    const endDate = project.end_date
        ? project.end_date.split("T")[0]
        : "";

    card.innerHTML = `
        <div class="project-header">
            <div class="project-title">${project.title}</div>

            <div class="menu-wrapper">
                <button class="menu-btn">⋮</button>

                <div class="menu hidden">
                    <button class="menu-item edit">Rediger</button>
                    <button class="menu-item delete">Slett</button>
                </div>
            </div>
        </div>

        <p>${project.description || ""}</p>

        <div style="margin-top:10px;">
            <small>${startDate} → ${endDate}</small>
        </div>

        <button class="details-btn">Se Prosjekt Detaljer</button>
    `;

    // =========================
    // MENU TOGGLE (LOCAL ONLY)
    // =========================
    const menuBtn = card.querySelector(".menu-btn");
    const menu = card.querySelector(".menu");

    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        document.querySelectorAll(".menu").forEach(m => {
            if (m !== menu) m.classList.add("hidden");
        });

        menu.classList.toggle("hidden");
    });

    // =========================
    // CLOSE MENUS (GLOBAL SAFE VERSION)
    // =========================
    document.addEventListener("click", closeAllMenus);

    function closeAllMenus() {
        document.querySelectorAll(".menu").forEach(m => {
            m.classList.add("hidden");
        });
    }

    // =========================
    // EDIT PROJECT
    // =========================
    const editBtn = card.querySelector(".menu-item.edit");

    editBtn.addEventListener("click", () => {
        editingProjectId = project.id;

        document.getElementById("modalTitle").textContent = "Edit Project";

        projectTitle.value = project.title;
        projectDescription.value = project.description || "";
        projectStart.value = project.start_date?.split("T")[0] || "";
        projectEnd.value = project.end_date?.split("T")[0] || "";
        projectColor.value = project.color;

        projectModal.classList.remove("hidden");
    });

    // =========================
    // DELETE PROJECT (FIXED)
    // =========================
    const deleteBtn = card.querySelector(".menu-item.delete");

    deleteBtn.addEventListener("click", async () => {
        const confirmed = confirm(`Delete "${project.title}"?`);
        if (!confirmed) return;

        try {
            await fetch(`http://localhost:3007/api/projects/${project.id}`, {
                method: "DELETE"
            });

            await loadProjects();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    });

    // =========================
    // NAV TO PROJECT DETAILS
    // =========================
    const detailsBtn = card.querySelector(".details-btn");

    detailsBtn.addEventListener("click", () => {
        window.location.href = `project.html?id=${project.id}`;
    });

    return card;
}

// =========================
// SAVE PROJECT (CREATE / UPDATE)
// =========================
saveProjectBtn.addEventListener("click", async () => {
    if (!projectTitle.value || !projectStart.value || !projectEnd.value) {
        alert("Fill required fields");
        return;
    }

    const projectData = {
        title: projectTitle.value,
        description: projectDescription.value,
        color: projectColor.value,
        start_date: projectStart.value,
        end_date: projectEnd.value
    };

    try {
        const url = editingProjectId
            ? `http://localhost:3007/api/projects/${editingProjectId}`
            : "http://localhost:3007/api/projects";

        const method = editingProjectId ? "PUT" : "POST";

        await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(projectData)
        });

        // reset UI
        projectTitle.value = "";
        projectDescription.value = "";
        projectStart.value = "";
        projectEnd.value = "";
        projectColor.value = "#4F8EF7";

        editingProjectId = null;
        projectModal.classList.add("hidden");

        await loadProjects();

    } catch (err) {
        console.error("Save failed:", err);
    }
});

// =========================
// INIT
// =========================
loadProjects();
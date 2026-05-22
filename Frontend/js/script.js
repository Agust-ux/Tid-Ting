const projectModal = document.getElementById("projectModal");
const openProjectModal = document.getElementById("openProjectModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveProjectBtn = document.getElementById("saveProjectBtn");

const projectGrid = document.getElementById("projectGrid");

const projectTitle = document.getElementById("projectTitle");
const projectDescription = document.getElementById("projectDescription");
const projectStart = document.getElementById("projectStart");
const projectEnd = document.getElementById("projectEnd");

openProjectModal.addEventListener("click", () => {
    projectModal.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", () => {
    projectModal.classList.add("hidden");
});

function formatDate(dateString) {
    const date = new Date(dateString);

    return date.toLocaleDateString("no-NO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

async function loadProjects() {

    try {
        const res = await fetch("http://localhost:3007/api/projects");
        const projects = await res.json();
        projectGrid.innerHTML = "";
        projects.forEach(project => {
            const card = document.createElement("div");
            card.className = "project-card";

            card.innerHTML = `
                <div class="project-header">

                    <div class="project-title">
                        ${project.title}
                    </div>

                    <div class="menu-wrapper">
                        <button class="menu-btn">⋮</button>
                        <div class="menu hidden">
                            <button class="menu-item edit">Edit</button>
                            <button class="menu-item details">Project details</button>
                            <button class="menu-item delete">Delete</button>
                        </div>
                    </div>
                </div>

                <p>
                    ${project.description || ""}
                </p>

                <div style="margin-top:10px;">
                    <small>
                        ${formatDate(project.start_date)} –– ${formatDate(project.end_date)}
                    </small>
                </div>

                <button class="details-btn">
                    See project details
                </button>
            `;

            const menuBtn = card.querySelector(".menu-btn");
            const menu = card.querySelector(".menu");

            menuBtn.addEventListener("click", (e) => {
                e.stopPropagation();

                // close all other menus first
                document.querySelectorAll(".menu").forEach(m => {
                    if (m !== menu) m.classList.add("hidden");
                });

                menu.classList.toggle("hidden");
            });

            document.addEventListener("click", () => {
                document.querySelectorAll(".menu").forEach(m => {
                    m.classList.add("hidden");
                });
            });

            document.addEventListener("click", () => {
                menu.classList.add("hidden");
            });

            const deleteBtn = card.querySelector(".menu-item.delete");
            deleteBtn.addEventListener("click", async () => {
                await fetch(
                    `http://localhost:3007/api/projects/${project.id}`,
                    { method: "DELETE" }
                );
                loadProjects();
            });

            const detailsBtn = card.querySelector(".details-btn");
            detailsBtn.addEventListener("click", () => {
                window.location.href =
                    `project.html?id=${project.id}`;
                });
                const editBtn = card.querySelector(".menu-item.edit");
                editBtn.addEventListener("click", () => {
                    alert("Edit coming next step");
                });
                projectGrid.appendChild(card);
        });
    } catch (err) {
        console.error("Failed to load projects:", err);
    }
}



saveProjectBtn.addEventListener("click", async () => {

    if (
        !projectTitle.value ||
        !projectStart.value ||
        !projectEnd.value
    ) {
        alert("Please fill all required fields");
        return;
    }

    const newProject = {
        title: projectTitle.value,
        description: projectDescription.value,
        color: "#80df6d",
        start_date: projectStart.value,
        end_date: projectEnd.value
    };

    try {
        await fetch("http://localhost:3007/api/projects", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newProject)
        });

        await loadProjects();

        projectTitle.value = "";
        projectDescription.value = "";
        projectStart.value = "";
        projectEnd.value = "";

        projectModal.classList.add("hidden");

    } catch (err) {
        console.error("Failed to save project:", err);
    }
});

loadProjects();
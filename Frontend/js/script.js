let editingProjectId = null;
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

openProjectModal.addEventListener("click", () => {
    editingProjectId = null;
    document.getElementById("modalTitle")
        .textContent = "Nytt prosjekt";
    projectTitle.value = "";
    projectDescription.value = "";
    projectStart.value = "";
    projectEnd.value = "";
    projectColor.value = "#80df6d";
    projectModal.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", () => {
    projectModal.classList.add("hidden");

});

async function loadProjects() {
    try {
        const res = await fetch(
            "http://localhost:3007/api/projects"
        );
        const projects = await res.json();
        console.log("PROJECTS:", projects);
        projectGrid.innerHTML = "";
        projects.forEach(project => {
            const startDate =
                project.start_date
                ?
                project.start_date.split("T")[0]
                :
                "";
            const endDate =
                project.end_date
                ?
                project.end_date.split("T")[0]
                :
                "";
            const card =
                document.createElement("div");
            card.className = "project-card";
            card.style.borderLeft =
                `12px solid ${project.color}`;
            card.innerHTML = `
                <div class="project-header">
                    <div class="project-title">
                        ${project.title}
                    </div>
                    <div class="menu-wrapper">
                        <button class="menu-btn">
                            ⋮
                        </button>
                        <div class="menu hidden">

                            <button
                                class="menu-item edit"
                            >
                                Rediger
                            </button>
                            <button
                                class="menu-item delete"
                            >
                                Slett
                            </button>
                        </div>
                    </div>
                </div>
                <p>
                    ${project.description || ""}
                </p>
                <div style="margin-top:10px;">
                    <small>
                        ${startDate}
                        →
                        ${endDate}
                    </small>
                </div>
                <button class="details-btn">
                    Se Prosjekt Detaljer
                </button>
            `;

            const menuBtn =
                card.querySelector(".menu-btn");
            const menu =
                card.querySelector(".menu");
            menuBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                document
                    .querySelectorAll(".menu")
                    .forEach(m => {

                        if (m !== menu) {
                            m.classList.add("hidden");
                        }
                    });
                menu.classList.toggle("hidden");
            });

            document.addEventListener("click", () => {
                menu.classList.add("hidden");
            });

            const editBtn =
                card.querySelector(".menu-item.edit");
            editBtn.addEventListener("click", () => {
                editingProjectId = project.id;
                document.getElementById("modalTitle")
                    .textContent = "Edit Project";
                projectTitle.value =
                    project.title;
                projectDescription.value =
                    project.description || "";
                projectStart.value =
                    project.start_date.split("T")[0];
                projectEnd.value =
                    project.end_date.split("T")[0];
                projectColor.value =
                    project.color;
                projectModal.classList.remove("hidden");
            });
            const deleteBtn =
                card.querySelector(".menu-item.delete");
            deleteBtn.addEventListener("click", async () => {
                const confirmed =
                    confirm(
                        `Delete "${project.title}"?`
                    );
                if (!confirmed) return;
                try {
                    await fetch(
                        `http://localhost:3007/api/projects/${project.id}`,
                        {
                            method: "DELETE"
                        }
                    );
                    loadProjects();
                } catch (err) {
                    console.error(err);
                }
            });
            const detailsBtn =
                card.querySelector(".details-btn");
            detailsBtn.addEventListener("click", () => {
                window.location.href =
                    `project.html?id=${project.id}`;
            });
            projectGrid.appendChild(card);
            projectGrid.appendChild(card);
        });
    } catch (err) {
        console.error(
            "Failed to load projects:",
            err
        );
    }
}

saveProjectBtn.addEventListener("click", async () => {
    if (
        !projectTitle.value ||
        !projectStart.value ||
        !projectEnd.value
    ) {
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
        let res;
        if (editingProjectId) {
            res = await fetch(
                `http://localhost:3007/api/projects/${editingProjectId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify(projectData)
                }
            );
        } else {
            res = await fetch(
                "http://localhost:3007/api/projects",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify(projectData)
                }
            );
        }

        const data = await res.json();
        console.log(data);
        await loadProjects();
        projectTitle.value = "";
        projectDescription.value = "";
        projectStart.value = "";
        projectEnd.value = "";
        projectColor.value = "#80df6d";
        editingProjectId = null;
        document.getElementById("modalTitle")
            .textContent = "Nytt prosjekt";
        projectModal.classList.add("hidden");
    } catch (err) {
        console.error(err);
    }
});

loadProjects();
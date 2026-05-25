document.addEventListener("DOMContentLoaded", () => {

const projectId = new URLSearchParams(window.location.search).get("id");

let editingTaskId = null;
let projectColor = "#80df6d";

// =========================
// DOM
// =========================
const taskList = document.getElementById("taskList");
const addBtn = document.getElementById("addTaskBtn");

const editModal = document.getElementById("editModal");
const editTitle = document.getElementById("editTitle");
const editDescription = document.getElementById("editDescription");
const editPriority = document.getElementById("editPriority");
const editDueDate = document.getElementById("editDueDate");

// =========================
// API LAYER
// =========================
const API = {
    getProjects: () => fetch("/api/projects").then(r => r.json()),
    getTasks: () => fetch(`/api/projects/${projectId}/tasks`).then(r => r.json()),
    createTask: (data) =>
        fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        }),

    updateTask: (id, data) =>
        fetch(`/api/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        }),

    deleteTask: (id) =>
        fetch(`/api/tasks/${id}`, { method: "DELETE" }),

    toggleDone: (id) =>
        fetch(`/api/tasks/${id}/toggle-done`, { method: "PATCH" })
};

// =========================
// RENDER TASK
// =========================
function renderTask(task) {
    const div = document.createElement("div");
    div.className = `task-card ${task.completed ? "done" : ""}`;

    div.innerHTML = `
        <div class="task-header">
            <h3>${task.title}</h3>
            <span class="priority ${task.priority}">
                ${task.priority}
            </span>
        </div>

        <p>${task.description || ""}</p>

        <small>${task.due_date ? new Date(task.due_date).toLocaleString() : "No date"}</small>

        <div class="task-actions">
            <button class="done-btn">${task.completed ? "Undone" : "Done"}</button>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </div>
    `;

    div.querySelector(".done-btn").onclick = async () => {
        await API.toggleDone(task.id);
        loadTasks();
    };

    div.querySelector(".delete-btn").onclick = async () => {
        await API.deleteTask(task.id);
        loadTasks();
    };

    div.querySelector(".edit-btn").onclick = () => {
        editingTaskId = task.id;
        editTitle.value = task.title;
        editDescription.value = task.description || "";
        editPriority.value = task.priority;
        editDueDate.value = task.due_date ? new Date(task.due_date).toISOString().slice(0,16) : "";
        editModal.classList.remove("hidden");
    };

    taskList.appendChild(div);
}

// =========================
// LOAD PROJECT DETAILS
// =========================
async function loadProject() {

    const projectTitleEl = document.getElementById("projectTitle");
    const projectDescriptionEl = document.getElementById("projectDescription");
    const hero = document.querySelector(".project-hero");

    const projects = await API.getProjects();
    const project = projects.find(p => p.id == projectId);

    if (!project) {
        projectTitleEl.textContent = "Project not found";
        return;
    }

    // =========================
    // TEXT
    // =========================
    projectTitleEl.textContent = project.title;
    projectDescriptionEl.textContent = project.description || "";

    // =========================
    // COLOR THEME (THIS WAS MISSING)
    // =========================
    const color = project.color || "#80df6d";

    hero.style.background = `
        linear-gradient(
            135deg,
            ${color}22,
            ${color}10
        )
    `;

    hero.style.border = `2px solid ${color}`;

    // optional global variable sync
    projectColor = color;
}

// =========================
// LOAD TASKS
// =========================
async function loadTasks() {
    const tasks = await API.getTasks();
    taskList.innerHTML = "";
    tasks.forEach(renderTask);
}

// =========================
// SAVE EDIT
// =========================
document.getElementById("saveEdit").onclick = async () => {

    await API.updateTask(editingTaskId, {
        title: editTitle.value,
        description: editDescription.value,
        priority: editPriority.value,
        due_date: editDueDate.value
    });

    editModal.classList.add("hidden");
    editingTaskId = null;
    loadTasks();
};

// CLOSE MODAL
document.getElementById("closeEdit").onclick = () => {
    editModal.classList.add("hidden");
};

// ADD TASK
addBtn.onclick = async () => {

    const title = document.getElementById("taskTitle").value;

    if (!title) return alert("Title required");

    await API.createTask({
        project_id: projectId,
        title,
        description: document.getElementById("taskDescription").value,
        priority: document.getElementById("taskPriority").value,
        due_date: document.getElementById("taskDueDate").value
    });

    loadTasks();
};

// INIT
loadProject();
loadTasks();
});
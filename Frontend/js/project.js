document.addEventListener("DOMContentLoaded", () => {

const params = new URLSearchParams(window.location.search);
const projectId = params.get("id");

const addTaskBtn = document.getElementById("addTaskBtn");
const taskTitle = document.getElementById("taskTitle");
const taskDescription = document.getElementById("taskDescription");
const taskPriority = document.getElementById("taskPriority");
const taskDueDate = document.getElementById("taskDueDate");
const taskList = document.getElementById("taskList");

async function loadProject() {
    const res = await fetch("http://localhost:3007/api/projects");
    const projects = await res.json();
    const project = projects.find(p => p.id == projectId);
    if (!project) return;
    document.getElementById("projectTitle").textContent = project.title;
    document.getElementById("projectDescription").textContent = project.description || "";
}

async function loadTasks() {
    const res = await fetch(`http://localhost:3007/api/projects/${projectId}/tasks`);
    const tasks = await res.json();

    taskList.innerHTML = "";

    tasks.forEach(task => {
        const div = document.createElement("div");

        const date = task.due_date ? new Date(task.due_date).toLocaleDateString() : "No date";

        div.className = "task-card";
        div.innerHTML = `
            <div class="task-header">
                <h3>${task.title}</h3>
                <span class="priority ${task.priority}">${task.priority}</span>
            </div>
            <p>${task.description || ""}</p>
            <small>${date}</small>
            <br><br>
            <button onclick="deleteTask(${task.id})">Delete</button>
        `;

        taskList.appendChild(div);
    });
}

window.deleteTask = async function(id) {
    await fetch(`http://localhost:3007/api/tasks/${id}`, {
        method: "DELETE"
    });
    loadTasks();
};

addTaskBtn.addEventListener("click", async () => {

    if (!taskTitle.value) return alert("Title required");

    const payload = {
        project_id: projectId,
        title: taskTitle.value,
        description: taskDescription.value,
        priority: taskPriority.value,
        due_date: taskDueDate.value
    };

    await fetch("http://localhost:3007/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    taskTitle.value = "";
    taskDescription.value = "";
    taskDueDate.value = "";

    loadTasks();
});

loadProject();
loadTasks();

});
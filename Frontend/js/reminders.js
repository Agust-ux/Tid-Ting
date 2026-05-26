/**
 * =========================
 * REMINDERS SYSTEM
 * =========================
 * - Backend synced
 * - No localStorage
 * - Stable rendering
 * - Toggle complete
 * - Delete reminders
 * - Empty state support
 */

/* =========================
   DOM
========================= */

const inputBox =
    document.getElementById("input-box");

const listContainer =
    document.getElementById("list-container");

const addBtn =
    document.getElementById("addBtn");

/* =========================
   API
========================= */

const API = {

    async getReminders() {

        const res = await fetch(
            "http://localhost:3007/api/reminders"
        );

        return await res.json();
    },

    async createReminder(reminderData) {

        await fetch(
            "http://localhost:3007/api/reminders",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(reminderData)
            }
        );
    },

    async toggleReminder(id) {

        await fetch(
            `http://localhost:3007/api/reminders/${id}/toggle`,
            {
                method: "PATCH"
            }
        );
    },

    async deleteReminder(id) {

        await fetch(
            `http://localhost:3007/api/reminders/${id}`,
            {
                method: "DELETE"
            }
        );
    }
};

/* =========================
   EMPTY STATE
========================= */

function updateEmptyState() {

    if (listContainer.children.length === 0) {

        listContainer.innerHTML = `
            <p class="empty">
                Ingen oppgaver enda ✨
            </p>
        `;
    }
}

/* =========================
   FORMAT DATE
========================= */

function formatDate(dateString) {

    const date = new Date(dateString);

    return date.toLocaleString("no-NO", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

/* =========================
   CREATE ELEMENT
========================= */

function createReminderElement(reminder) {

    const li =
        document.createElement("li");

    li.dataset.id = reminder.id;

    if (reminder.completed) {
        li.classList.add("checked");
    }

    li.innerHTML = `
        ${reminder.title}

        <small class="reminder-time">
            ${formatDate(reminder.remind_at)}
        </small>

        <span>&times;</span>
    `;

    return li;
}

/* =========================
   LOAD REMINDERS
========================= */

async function loadReminders() {

    try {

        const reminders =
            await API.getReminders();

        listContainer.innerHTML = "";

        reminders.forEach(reminder => {

            const li =
                createReminderElement(reminder);

            listContainer.appendChild(li);
        });

        updateEmptyState();

    } catch (err) {

        console.error(
            "Failed to load reminders:",
            err
        );
    }
}

/* =========================
   ADD REMINDER
========================= */

async function addReminder() {

    const value =
        inputBox.value.trim();

    if (value === "") {

        alert("Feltet kan ikke stå tomt");

        return;
    }

    try {

        await API.createReminder({

            title: value,

            remind_at:
                new Date()
                    .toISOString()
                    .slice(0, 19)
                    .replace("T", " ")
        });

        inputBox.value = "";

        await loadReminders();

    } catch (err) {

        console.error(
            "Failed to create reminder:",
            err
        );
    }
}

/* =========================
   EVENTS
========================= */

addBtn.addEventListener(
    "click",
    addReminder
);

inputBox.addEventListener(
    "keydown",
    function(e) {

        if (e.key === "Enter") {
            addReminder();
        }
    }
);

listContainer.addEventListener(
    "click",
    async function(e) {

        const li =
            e.target.closest("li");

        if (!li) return;

        const id = li.dataset.id;

        try {

            if (e.target.tagName === "SPAN") {

                await API.deleteReminder(id);

            } else {

                await API.toggleReminder(id);
            }

            await loadReminders();

        } catch (err) {

            console.error(
                "Reminder action failed:",
                err
            );
        }
    }
);

/* =========================
   INIT
========================= */

loadReminders();
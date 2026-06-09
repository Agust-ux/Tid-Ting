// =========================
// SERVER SETUP
// =========================
const express = require("express");
const path = require("path");
const mariadb = require("mariadb");
require("dotenv").config();

const app = express();
app.use(express.json());
require("dotenv").config();
// =========================
// DATABASE POOL
// =========================
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    connectionLimit: 5
});

// =========================
// STATIC FRONTEND
// =========================
app.use(express.static(path.join(__dirname, "../Frontend")));

// =========================
// HELPERS
// =========================
async function getConn() {
    return await pool.getConnection();
}

// =========================
// PROJECT ROUTES
// =========================

// GET all projects
app.get("/api/projects", async (req, res) => {
    let conn;
    try {
        conn = await getConn();
        const data = await conn.query(
            "SELECT * FROM projects ORDER BY id DESC"
        );
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch projects" });
    } finally {
        if (conn) conn.release();
    }
});

// CREATE project
app.post("/api/projects", async (req, res) => {
    let conn;
    try {
        const { title, description, color, start_date, end_date } = req.body;

        conn = await getConn();

        const result = await conn.query(
            `INSERT INTO projects 
            (user_id, title, description, color, start_date, end_date)
            VALUES (1, ?, ?, ?, ?, ?)`,
            [title, description, color, start_date, end_date]
        );

        res.json({ success: true, id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Project creation failed" });
    } finally {
        if (conn) conn.release();
    }
});

// UPDATE project
app.put("/api/projects/:id", async (req, res) => {
    let conn;
    try {
        const { title, description, color, start_date, end_date } = req.body;

        conn = await getConn();

        await conn.query(
            `UPDATE projects 
             SET title=?, description=?, color=?, start_date=?, end_date=? 
             WHERE id=?`,
            [title, description, color, start_date, end_date, req.params.id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Project update failed" });
    } finally {
        if (conn) conn.release();
    }
});

// ❗ FIXED: DELETE project (THIS WAS MISSING / BROKEN BEFORE)
app.delete("/api/projects/:id", async (req, res) => {
    let conn;
    try {
        conn = await getConn();

        await conn.query(
            "DELETE FROM projects WHERE id=?",
            [req.params.id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Project delete failed" });
    } finally {
        if (conn) conn.release();
    }
});

// =========================
// TASK ROUTES
// =========================

// GET tasks for project
app.get("/api/projects/:id/tasks", async (req, res) => {
    let conn;
    try {
        conn = await getConn();

        const tasks = await conn.query(
            `SELECT * FROM tasks 
             WHERE project_id = ? 
             ORDER BY completed ASC, created_at DESC`,
            [req.params.id]
        );

        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Task fetch failed" });
    } finally {
        if (conn) conn.release();
    }
});

// CREATE task
app.post("/api/tasks", async (req, res) => {
    let conn;
    try {
        const { project_id, title, description, priority, due_date } = req.body;

        conn = await getConn();

        await conn.query(
            `INSERT INTO tasks 
             (project_id, title, description, priority, due_date, completed)
             VALUES (?, ?, ?, ?, ?, 0)`,
            [project_id, title, description, priority, due_date || null]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Task creation failed" });
    } finally {
        if (conn) conn.release();
    }
});

// UPDATE task
app.put("/api/tasks/:id", async (req, res) => {
    let conn;
    try {
        let { title, description, priority, due_date } = req.body;

        if (!title) title = "";
        if (!description) description = "";
        if (!["low", "medium", "high"].includes(priority)) priority = "medium";

        if (due_date && due_date.includes("T")) {
            due_date = due_date.replace("T", " ") + ":00";
        } else if (!due_date) {
            due_date = null;
        }

        conn = await getConn();

        await conn.query(
            `UPDATE tasks 
             SET title=?, description=?, priority=?, due_date=? 
             WHERE id=?`,
            [title, description, priority, due_date, req.params.id]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Task update failed" });
    } finally {
        if (conn) conn.release();
    }
});

// DELETE task
app.delete("/api/tasks/:id", async (req, res) => {
    let conn;
    try {
        conn = await getConn();

        await conn.query(
            "DELETE FROM tasks WHERE id=?",
            [req.params.id]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Task delete failed" });
    } finally {
        if (conn) conn.release();
    }
});

// TOGGLE DONE
app.patch("/api/tasks/:id/toggle-done", async (req, res) => {
    let conn;
    try {
        conn = await getConn();

        await conn.query(
            `UPDATE tasks 
             SET completed = NOT COALESCE(completed, 0)
             WHERE id=?`,
            [req.params.id]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Toggle failed" });
    } finally {
        if (conn) conn.release();
    }
});

// =========================
// DELETE PROJECT
// =========================
app.delete("/api/projects/:id", async (req, res) => {
    let conn;

    try {
        conn = await getConn();

        // optional safety: delete tasks first
        await conn.query("DELETE FROM tasks WHERE project_id=?", [req.params.id]);

        await conn.query("DELETE FROM projects WHERE id=?", [req.params.id]);

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Project delete failed" });
    } finally {
        if (conn) conn.end();
    }
});

app.post("/api/reminders", async (req, res) => {

    let conn;

    try {

        const {
            title,
            remind_at
        } = req.body;

        conn = await getConn();

        const result = await conn.query(
            `INSERT INTO reminders
             (user_id, title, remind_at)
             VALUES (1, ?, ?)`,
            [
                title,
                remind_at
            ]
        );

        res.json({
            success: true,
            id: Number(result.insertId)
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Failed to create reminder"
        });

    } finally {

        if (conn) conn.end();
    }
});

app.get("/api/reminders", async (req, res) => {

    let conn;

    try {

        conn = await getConn();

        const reminders = await conn.query(
            `SELECT *
             FROM reminders
             ORDER BY completed ASC,
                      remind_at ASC`
        );

        const cleaned = reminders.map(r => ({
            id: Number(r.id),
            title: r.title,
            remind_at: r.remind_at,
            completed: Boolean(r.completed)
        }));

        res.json(cleaned);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Failed to fetch reminders"
        });

    } finally {

        if (conn) conn.end();
    }
});

app.patch("/api/reminders/:id/toggle", async (req, res) => {

    let conn;

    try {

        conn = await getConn();

        await conn.query(
            `UPDATE reminders
             SET completed = NOT completed
             WHERE id=?`,
            [req.params.id]
        );

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Toggle failed"
        });

    } finally {

        if (conn) conn.end();
    }
});

app.delete("/api/reminders/:id", async (req, res) => {

    let conn;

    try {

        conn = await getConn();

        await conn.query(
            `DELETE FROM reminders
             WHERE id=?`,
            [req.params.id]
        );

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Delete failed"
        });

    } finally {

        if (conn) conn.end();
    }
});

// =========================
// START SERVER
// =========================
app.listen(3008, () => {
    console.log("Server running on http://localhost:3008");
});
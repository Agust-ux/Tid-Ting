//Utgangspunkt fra https://www.youtube.com/watch?v=Hej48pi_lOc
const express = require('express');
const path = require('path');
const mariadb = require('mariadb');
require('dotenv').config();

const app = express();

app.use(express.json());

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    connectionLimit: parseInt(process.env.DB_LIMIT) || 5
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});

app.get('/calendar.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/calendar.html'));
});

app.get('/reminders.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/reminders.html'));
});

app.use(express.static(__dirname));

app.listen(3007, () => {
    console.log('Server running on http://localhost:3007');
});


//DISSE ER TEST MELDINGER
app.get('/api/test', (req, res) => {
    res.json({ message: "API is working" });
});

app.get('/api/db-test', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query("SELECT 1 AS ok");
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB failed" });
    } finally {
        if (conn) conn.end();
    }
});

//HER BEGYNNER API

//Prosjekter endpoints
app.get('/api/projects', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(`
            SELECT * FROM projects
            ORDER BY id DESC
        `);
        res.json(rows);

    } catch (err) {
        res.status(500).json({ error: "DB error" });
    } finally {
        if (conn) conn.end();
    }
});

app.post('/api/projects', async (req, res) => {
    let conn;

    try {
        const { title, description, color, start_date, end_date } = req.body;

        // TEMP: hardcoded user (because no login system yet)
        const user_id = 1;

        // basic validation (prevents empty inserts)
        if (!title || !start_date || !end_date) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        conn = await pool.getConnection();

        const result = await conn.query(
            `INSERT INTO projects
            (user_id, title, description, color, start_date, end_date)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, title, description, color, start_date, end_date]
        );

        res.json({
            message: "Project created",
            insertId: Number(result.insertId)
        });

    } catch (err) {
        console.error("DB INSERT ERROR:", err);

        res.status(500).json({
            error: err.message
        });

    } finally {
        if (conn) conn.end();
    }
});
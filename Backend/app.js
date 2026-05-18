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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/calendar.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'calendar.html'));
});

app.get('/reminders.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'reminders.html'));
});

app.use(express.static(__dirname));

//Utgangtpunkt https://mariadb.com/docs/connectors/mariadb-connector-nodejs/getting-started-with-the-node-js-connector

app.listen(3007, () => {
    console.log('Server running on http://localhost:3007');
});
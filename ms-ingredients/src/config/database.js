const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const serviceDirectory = path.join(__dirname, '..', '..');
const dbFile = process.env.DB_FILE === ':memory:'
    ? ':memory:'
    : path.resolve(serviceDirectory, process.env.DB_FILE || 'ingredients.sqlite');
const db = new sqlite3.Database(dbFile);

db.exec(`
    CREATE TABLE IF NOT EXISTS ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        price REAL NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );
`, (err) => {
    if (err) throw err;
});

module.exports = db;

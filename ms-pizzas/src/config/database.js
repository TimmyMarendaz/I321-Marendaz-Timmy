const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const serviceDirectory = path.join(__dirname, '..', '..');
const dbFile = process.env.DB_FILE === ':memory:'
    ? ':memory:'
    : path.resolve(serviceDirectory, process.env.DB_FILE || 'pizzas.sqlite');
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
    db.exec(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS pizzas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            imageUrl TEXT,
            price REAL NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS product_compositions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL CHECK (item_id > 0),
            created_at TEXT DEFAULT (datetime('now')),
            UNIQUE (product_id, item_id),
            FOREIGN KEY (product_id) REFERENCES pizzas(id) ON DELETE CASCADE
        );
    `, (err) => {
        if (err) throw err;
    });
});

module.exports = db;

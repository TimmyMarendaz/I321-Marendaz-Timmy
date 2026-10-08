const db = require('../config/database');

// Accès aux données de la ressource Ingrédients.
class Ingredient {
    static create({ name, price }) {
        const sql = `
            INSERT INTO ingredients (name, price, created_at, updated_at)
            VALUES (?, ?, datetime('now'), datetime('now'))
        `;

        return new Promise((resolve, reject) => {
            db.run(sql, [name, price], function (err) {
                if (err) return reject(err);
                Ingredient.findById(this.lastID).then(resolve).catch(reject);
            });
        });
    }

    static findAll() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM ingredients ORDER BY id DESC', [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    static findById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM ingredients WHERE id = ?', [id], (err, row) => {
                if (err) return reject(err);
                resolve(row || null);
            });
        });
    }

    static update(id, { name, price }) {
        const sql = `
            UPDATE ingredients
            SET name = ?,
                price = ?,
                updated_at = datetime('now')
            WHERE id = ?
        `;

        return new Promise((resolve, reject) => {
            db.run(sql, [name, price, id], function (err) {
                if (err) return reject(err);
                if (this.changes === 0) return resolve(null);
                Ingredient.findById(id).then(resolve).catch(reject);
            });
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM ingredients WHERE id = ?', [id], function (err) {
                if (err) return reject(err);
                resolve(this.changes);
            });
        });
    }
}

module.exports = Ingredient;

const db = require('../config/database');

// Accès aux données de la ressource Pizzas.
class Pizza {
    static create({ name, ingredients, imageUrl, price }) {
        const sql = `
            INSERT INTO pizzas (name, ingredients, imageUrl, price, created_at, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
        `;
        const params = [name, ingredients ?? null, imageUrl ?? null, price];

        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) return reject(err);
                Pizza.findById(this.lastID).then(resolve).catch(reject);
            });
        });
    }

    static findAll() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM pizzas ORDER BY id DESC', [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    static findById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM pizzas WHERE id = ?', [id], (err, row) => {
                if (err) return reject(err);
                resolve(row || null);
            });
        });
    }

    static update(id, { name, ingredients, imageUrl, price }) {
        const sql = `
            UPDATE pizzas
            SET name = ?,
                ingredients = ?,
                imageUrl = ?,
                price = ?,
                updated_at = datetime('now')
            WHERE id = ?
        `;
        const params = [name, ingredients ?? null, imageUrl ?? null, price, id];

        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) return reject(err);
                if (this.changes === 0) return resolve(null);
                Pizza.findById(id).then(resolve).catch(reject);
            });
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM pizzas WHERE id = ?', [id], function (err) {
                if (err) return reject(err);
                resolve(this.changes);
            });
        });
    }
}

module.exports = Pizza;

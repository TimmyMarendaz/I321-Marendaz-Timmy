const db = require('../config/database');

// Cette entité ne connaît que la base locale des pizzas.
class Pizza {
    static create({ name, imageUrl, price }) {
        return new Promise((resolve, reject) => {
            db.run(
                "INSERT INTO pizzas (name, imageUrl, price) VALUES (?, ?, ?)",
                [name, imageUrl ?? null, price],
                function (err) {
                    if (err) return reject(err);
                    Pizza.findById(this.lastID).then(resolve).catch(reject);
                }
            );
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

    static update(id, { name, imageUrl, price }) {
        return new Promise((resolve, reject) => {
            db.run(
                "UPDATE pizzas SET name = ?, imageUrl = ?, price = ?, updated_at = datetime('now') WHERE id = ?",
                [name, imageUrl ?? null, price, id],
                function (err) {
                    if (err) return reject(err);
                    if (this.changes === 0) return resolve(null);
                    Pizza.findById(id).then(resolve).catch(reject);
                }
            );
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

    static findCompositions(productId) {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM product_compositions WHERE product_id = ? ORDER BY id',
                [productId],
                (err, rows) => err ? reject(err) : resolve(rows)
            );
        });
    }

    static addComposition(productId, itemId) {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO product_compositions (product_id, item_id) VALUES (?, ?)',
                [productId, itemId],
                function (err) {
                    if (err) return reject(err);
                    db.get('SELECT * FROM product_compositions WHERE id = ?', [this.lastID],
                        (error, row) => error ? reject(error) : resolve(row));
                }
            );
        });
    }

    static deleteCompositions(productId) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM product_compositions WHERE product_id = ?', [productId],
                function (err) {
                    if (err) return reject(err);
                    resolve(this.changes);
                });
        });
    }
}

module.exports = Pizza;

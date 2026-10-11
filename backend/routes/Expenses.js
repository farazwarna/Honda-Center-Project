import express from 'express'
import db from '../config/db.js';




const router=express.Router()


router.get('/expenses', async (req, res) => {
  try {
    const { category, from, to, search } = req.query;
    let sql    = 'SELECT * FROM expenses WHERE 1=1';
    const args = [];

    if (category) { sql += ' AND category = ?';         args.push(category); }
    if (from)     { sql += ' AND date >= ?';             args.push(from);     }
    if (to)       { sql += ' AND date <= ?';             args.push(to);       }
    if (search)   { sql += ' AND title LIKE ?';          args.push(`%${search}%`); }

    sql += ' ORDER BY date DESC, id DESC';

    const [rows] = await db.query(sql, args);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
//  GET  /api/expenses/summary
//  Returns total, count, and per-category breakdown
// ============================================================
router.get('/expenses/summary', async (req, res) => {
  try {
    const [totals] = await db.query(
      `SELECT
         COUNT(*)           AS count,
         SUM(amount)        AS total,
         MAX(amount)        AS largest,
         AVG(amount)        AS average
       FROM expenses`
    );

    const [byCat] = await db.query(
      `SELECT category, COUNT(*) AS count, SUM(amount) AS total
       FROM expenses
       GROUP BY category
       ORDER BY total DESC`
    );

    res.json({ success: true, data: { ...totals[0], byCategory: byCat } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
//  GET  /api/expenses/:id
// ============================================================
router.get('/expenses/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
//  POST /api/expenses
//  Body: { title, amount, category, description, date }
// ============================================================
router.post('/expenses', async (req, res) => {
  try {
    const { title, amount, category, description, date } = req.body;

    if (!title || !amount || !category || !date) {
      return res.status(400).json({ success: false, message: 'title, amount, category, date are required' });
    }

    const [result] = await db.query(
      `INSERT INTO expenses (title, amount, category, description, date)
       VALUES (?, ?, ?, ?, ?)`,
      [title, parseFloat(amount), category, description || null, date]
    );

    const [newRow] = await db.query('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newRow[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
//  PUT /api/expenses/:id
// ============================================================
router.put('/expenses/:id', async (req, res) => {
  try {
    const { title, amount, category, description, date } = req.body;

    await db.query(
      `UPDATE expenses SET title=?, amount=?, category=?, description=?, date=?
       WHERE id=?`,
      [title, parseFloat(amount), category, description || null, date, req.params.id]
    );

    const [rows] = await db.query('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
//  DELETE /api/expenses/:id
// ============================================================
router.delete('/expenses/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

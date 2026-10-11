import express from "express";
import db from "../config/db.js";

const router = express.Router();



// GET all parties with balance summary
router.get('/parties', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.id,
        p.name,
        p.phone,
        COALESCE(SUM(CASE WHEN t.type = 'gave' THEN t.amount ELSE 0 END), 0) AS total_gave,
        COALESCE(SUM(CASE WHEN t.type = 'took' THEN t.amount ELSE 0 END), 0) AS total_took
      FROM parties p
      LEFT JOIN transactions t ON t.party_id = p.id
      GROUP BY p.id
      ORDER BY p.name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// POST new party
router.post('/parties', async (req, res) => {
  const { name, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const [result] = await db.query(
      'INSERT INTO parties (name, phone) VALUES (?, ?)',
      [name, phone || null]
    );
    res.json({ id: result.insertId, name, phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// DELETE party
router.delete('/parties/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM parties WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// ── TRANSACTIONS ───────────────────────────────────────────
 
// GET transactions for a party
router.get('/transactions/:partyId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM transactions WHERE party_id = ? ORDER BY date DESC, created_at DESC',
      [req.params.partyId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// POST new transaction
router.post('/transactions', async (req, res) => {
  const { party_id, type, amount, note, date } = req.body;
  if (!party_id || !type || !amount) {
    return res.status(400).json({ error: 'party_id, type, and amount are required' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO transactions (party_id, type, amount, note, date) VALUES (?, ?, ?, ?, ?)',
      [party_id, type, amount, note || null, date || new Date().toISOString().split('T')[0]]
    );
    res.json({ id: result.insertId, party_id, type, amount, note, date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// DELETE transaction
router.delete('/transactions/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM transactions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});











export default router;
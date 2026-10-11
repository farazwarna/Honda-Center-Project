import express from 'express'
import db from '../config/db.js';




const router=express.Router()// adjust path to your DB connection

// ================================================================
// GET /Returns/getBySale/:sale_id
// Fetch all return headers for a given sale (with item count)
// ================================================================
router.get("/getBySale/:sale_id", async (req, res) => {
  const { sale_id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT
         r.return_id,
         r.sale_id,
         r.reason,
         r.notes,
         r.status,
         r.return_date,
         COUNT(ri.return_item_id) AS item_count
       FROM returns r
       LEFT JOIN return_items ri ON ri.return_id = r.return_id
       WHERE r.sale_id = ?
       GROUP BY r.return_id
       ORDER BY r.return_date DESC`,
      [sale_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("getBySale error:", err);
    res.status(500).json({ message: "Failed to fetch returns", error: err.message });
  }
});

// ================================================================
// GET /Returns/getItems/:return_id
// Fetch all items for a specific return
// ================================================================
router.get("/getItems/:return_id", async (req, res) => {
  const { return_id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT
         ri.*,
         p.Product_Name AS product_name_ref
       FROM return_items ri
       LEFT JOIN products p ON p.Product_Id = ri.product_id
       WHERE ri.return_id = ?`,
      [return_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("getItems error:", err);
    res.status(500).json({ message: "Failed to fetch return items", error: err.message });
  }
});

// ================================================================
// GET /Returns/getAll
// List all returns (admin overview) with pagination + filters
// ================================================================
router.get("/getAll", async (req, res) => {
  const page   = parseInt(req.query.page  || 1);
  const limit  = parseInt(req.query.limit || 10);
  const status = req.query.status || "all";   // pending | approved | rejected | all
  const offset = (page - 1) * limit;

  try {
    let where  = "";
    const vals = [];

    if (status !== "all") {
      where = "WHERE r.status = ?";
      vals.push(status);
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM returns r ${where}`,
      vals
    );

    const [rows] = await db.query(
      `SELECT
         r.*,
         c.name        AS customer_name,
         s.invoice_no,
         COUNT(ri.return_item_id) AS item_count
       FROM returns r
       LEFT JOIN customers c  ON c.customer_id = r.customer_id
       LEFT JOIN sales     s  ON s.id           = r.sale_id
       LEFT JOIN return_items ri ON ri.return_id = r.return_id
       ${where}
       GROUP BY r.return_id
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...vals, limit, offset]
    );

    res.json({
      data:       rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("getAll error:", err);
    res.status(500).json({ message: "Failed to fetch returns", error: err.message });
  }
});

// ================================================================
// POST /Returns/create
// Create a return header (status defaults to 'pending')
// Body: { sale_id, customer_id, reason, notes }
// ================================================================
router.post("/create", async (req, res) => {
  const { sale_id, customer_id, reason, notes } = req.body;

  if (!sale_id) {
    return res.status(400).json({ message: "sale_id is required" });
  }

  try {
    // make sure the sale actually exists
    const [[sale]] = await db.query(
      "SELECT id FROM sales WHERE id = ?",
      [sale_id]
    );
    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    const [result] = await db.query(
      `INSERT INTO returns (sale_id, customer_id, reason, notes, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [sale_id, customer_id || null, reason || null, notes || null]
    );

    res.status(201).json({
      message:   "Return created successfully",
      return_id: result.insertId,
    });
  } catch (err) {
    console.error("create error:", err);
    res.status(500).json({ message: "Failed to create return", error: err.message });
  }
});

// ================================================================
// POST /Returns/addItems
// Insert return_items rows for a return
// Body: { return_id, items: [{ product_id, product_name, quantity, sale_price, condition, notes }] }
// ================================================================
// ================================================================
// POST /Returns/addItems
// Insert return_items rows for a return
// Body: { return_id, items: [{ product_id, product_name, quantity, sale_price, condition, notes }] }
// ================================================================
router.post("/addItems", async (req, res) => {
  const { return_id, items } = req.body;

  if (!return_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "return_id and items[] are required" });
  }

  try {
    // verify return exists and is still pending
    const [[ret]] = await db.query(
      "SELECT return_id, status FROM returns WHERE return_id = ?",
      [return_id]
    );
    if (!ret) {
      return res.status(404).json({ message: "Return not found" });
    }
    if (ret.status !== "pending") {
      return res.status(400).json({ message: "Cannot add items to a non-pending return" });
    }

    // ✅ VALIDATE EACH ITEM HAS product_id
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_id) {
        console.error(`Item at index ${i} is missing product_id:`, item);
        return res.status(400).json({ 
          message: `Item "${item.product_name}" is missing product_id`,
          item: item,
          index: i
        });
      }
    }

    // bulk insert
    const values = items.map((it) => [
      return_id,
      it.product_id,
      it.product_name,
      it.quantity,
      it.sale_price,
      it.condition || "good",
      it.notes     || null,
    ]);

    await db.query(
      `INSERT INTO return_items
         (return_id, product_id, product_name, quantity, sale_price, \`condition\`, notes)
       VALUES ?`,
      [values]
    );

    res.status(201).json({ message: "Return items added successfully" });
  } catch (err) {
    console.error("addItems error:", err);
    res.status(500).json({ 
      message: "Failed to add return items", 
      error: err.message,
      sqlMessage: err.sqlMessage // ✅ Include SQL error details
    });
  }
});

// ================================================================
// PUT /Returns/approve/:return_id
// Calls the stored procedure approve_return(id)
// → sets status = 'approved'
// → restocks good-condition items in available_products
// ================================================================
router.put("/approve/:return_id", async (req, res) => {
  const { return_id } = req.params;
  try {
    await db.query("CALL approve_return(?)", [return_id]);
    res.json({ message: `Return #${return_id} approved and good items restocked.` });
  } catch (err) {
    console.error("approve error:", err);
    // stored procedure raises SIGNAL for invalid state
    res.status(400).json({ message: err.message || "Failed to approve return" });
  }
});

// ================================================================
// PUT /Returns/reject/:return_id
// Calls the stored procedure reject_return(id)
// ================================================================
router.put("/reject/:return_id", async (req, res) => {
  const { return_id } = req.params;
  try {
    await db.query("CALL reject_return(?)", [return_id]);
    res.json({ message: `Return #${return_id} has been rejected.` });
  } catch (err) {
    console.error("reject error:", err);
    res.status(400).json({ message: err.message || "Failed to reject return" });
  }
});

export default router;


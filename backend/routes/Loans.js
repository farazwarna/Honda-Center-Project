import express from "express";
import db from "../config/db.js";

const router = express.Router();


// ============================
// 📦 GET LOANS (PAGINATION + SEARCH)
// ============================
router.get("/getloansdata", async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;
    const like   = `%${search}%`;

    const [data] = await db.query(
      `SELECT * FROM customer_loan_view
       WHERE customer_name LIKE ?
       ORDER BY updated_at DESC
       LIMIT ? OFFSET ?`,
      [like, limit, offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM customer_loan_view WHERE customer_name LIKE ?`,
      [like]
    );

    res.json({ data, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});


// ============================
// 📜 GET PAYMENT HISTORY (PAGINATED)
// ============================
router.get("/payments/:loan_id", async (req, res) => {
  try {
    const loan_id = parseInt(req.params.loan_id);
    const page    = parseInt(req.query.page)  || 1;
    const limit   = parseInt(req.query.limit) || 5;
    const offset  = (page - 1) * limit;

    const [payments] = await db.query(
      `SELECT id, loan_id, customer_id, amount, payment_method,
              previous_remaining, new_remaining, received_by, created_at
       FROM loan_payments
       WHERE loan_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [loan_id, limit, offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM loan_payments WHERE loan_id = ?`,
      [loan_id]
    );

    res.json({ data: payments, total, page, totalPages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    console.error("❌ /payments/:loan_id error:", err);
    res.status(500).json({ success: false, message: err.sqlMessage || err.message });
  }
});


// ============================
// 💳 RECEIVE PAYMENT
// ============================
router.post("/receive-payment", async (req, res) => {
  try {
    let {
      loan_id,
      customer_id,
      loan_type,
      amount,
      payment_method = "cash",
      received_by = null,
    } = req.body;

    if (!loan_id)
      return res.status(400).json({ message: "loan_id is required" });

    if (!amount || Number(amount) <= 0)
      return res.status(400).json({ message: "Valid amount required" });

    if (!customer_id) {
      const [[row]] = await db.query(
        `SELECT customer_id FROM customer_loan_view WHERE loan_id = ?`,
        [Number(loan_id)]
      );
      customer_id = row?.customer_id;
    }

    if (!loan_type) {
      const [[row]] = await db.query(
        `SELECT loan_type FROM customer_loan_view WHERE loan_id = ?`,
        [Number(loan_id)]
      );
      loan_type = row?.loan_type;
    }

    // ============================
    // 💰 CASH LOAN
    // ============================
    if (loan_type === "cash_loan") {
      const [[loan]] = await db.query(
        `SELECT loan_id, remaining_amount, status
         FROM loans WHERE loan_id = ?`,
        [Number(loan_id)]
      );

      if (!loan)
        return res.status(404).json({ message: "Loan not found" });

      if (loan.status === "paid")
        return res.status(400).json({ message: "Already paid" });

      if (Number(amount) > Number(loan.remaining_amount))
        return res.status(400).json({
          message: `Amount exceeds remaining Rs ${loan.remaining_amount}`,
        });

      await db.query("CALL AddLoanPayment(?,?,?,?)", [
        Number(loan_id),
        Number(amount),
        payment_method,
        received_by || null,
      ]);
    }

    // ============================
    // 📦 PRODUCT LOAN
    // ============================
    else if (loan_type === "product_loan") {
      const [[sale]] = await db.query(
        `SELECT id, paid_amount, remaining_amount, status
         FROM sales
         WHERE id = ? AND payment_type = 'loan'`,
        [Number(loan_id)]
      );

      if (!sale)
        return res.status(404).json({ message: "Product loan not found" });

      if (sale.status === "paid" || sale.status === "completed")
        return res.status(400).json({ message: "Already paid" });

      if (Number(amount) > Number(sale.remaining_amount))
        return res.status(400).json({
          message: `Amount exceeds remaining Rs ${sale.remaining_amount}`,
        });

      const prevRemaining = Number(sale.remaining_amount);
      const newPaid = Number(sale.paid_amount) + Number(amount);
      const newRemaining = prevRemaining - Number(amount);

      await db.query(
        `UPDATE sales SET paid_amount = ?, updated_at = NOW() WHERE id = ?`,
        [newPaid, Number(loan_id)]
      );

      await db.query(
        `INSERT INTO loan_payments
         (loan_id, loan_type, customer_id, amount, payment_method,
          previous_remaining, new_remaining, received_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(loan_id),
          "product_loan",
          Number(customer_id),
          Number(amount),
          payment_method,
          prevRemaining,
          newRemaining,
          received_by || null,
        ]
      );
    } else {
      return res.status(400).json({ message: "Invalid loan type" });
    }

    res.json({ success: true, message: "Payment successful" });

  } catch (err) {
    console.error("❌ PAYMENT ERROR:", err);
    res.status(500).json({
      message: err.sqlMessage || err.message || "Server error",
    });
  }
});


// ============================
// 🔍 SEARCH CUSTOMERS
// ============================
router.get("/customers", async (req, res) => {
  try {
    const search = req.query.search || "";
    const [rows] = await db.query(
      `SELECT customer_id, name, phone
       FROM customers
       WHERE name LIKE ? OR phone LIKE ?
       LIMIT 10`,
      [`%${search}%`, `%${search}%`]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ============================
// 🔍 SEARCH AVAILABLE PRODUCTS (by name)
// ============================
router.get("/products", async (req, res) => {
  try {
    const search = req.query.search || "";
    const [rows] = await db.query(
      `SELECT
         ap.Ap_Id,
         ap.product_id,
         p.Product_Name,
         p.Product_Key,
         p.Model,
         ap.Quantity       AS stock,
         ap.selling_Price,
         ap.Wholesale_Price
       FROM available_products ap
       JOIN products p ON p.Product_Id = ap.product_id
       WHERE p.Product_Name LIKE ? AND ap.Quantity > 0
       LIMIT 15`,
      [`%${search}%`]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ============================
// ▦ LOOKUP PRODUCT BY BARCODE / QR (Product_Key)
// ============================
router.get("/product-by-key", async (req, res) => {
  try {
    const key = (req.query.key || "").trim();
    if (!key) return res.status(400).json({ message: "key is required" });

    const [rows] = await db.query(
      `SELECT
         ap.Ap_Id,
         ap.product_id,
         p.Product_Name,
         p.Product_Key,
         p.Model,
         ap.Quantity       AS stock,
         ap.selling_Price,
         ap.Wholesale_Price
       FROM available_products ap
       JOIN products p ON p.Product_Id = ap.product_id
       WHERE p.Product_Key = ?
       LIMIT 1`,
      [key]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "No product found for this barcode" });

    res.json({ data: rows[0] });
  } catch (err) {
    console.error("❌ /product-by-key error:", err);
    res.status(500).json({ message: err.sqlMessage || err.message });
  }
});


// ============================
// 🔍 CHECK EXISTING PENDING LOAN FOR CUSTOMER
// ============================
router.get("/existing-loan/:customer_id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, invoice_no, net_amount, paid_amount, remaining_amount
       FROM sales
       WHERE customer_id = ?
         AND payment_type = 'loan'
         AND status IN ('pending', 'partial')
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.params.customer_id]
    );
    res.json({ data: rows[0] || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ============================
// 🛒 ADD PRODUCT LOAN
// ============================
router.post("/add-product-loan", async (req, res) => {
  try {
    const {
      customer_id,
      items       = [],
      discount    = 0,
      paid_amount = 0,
      notes       = "",
      due_date    = null,   // ✅ NEW: accept due_date from frontend
    } = req.body;

    if (!items.length)
      return res.status(400).json({ message: "No items provided" });

    // Validate & lock stock rows
    for (const item of items) {
      const [[ap]] = await db.query(
        `SELECT Quantity FROM available_products WHERE Ap_Id = ? FOR UPDATE`,
        [item.Ap_Id]
      );
      if (!ap || ap.Quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for: ${item.Product_Name}`,
        });
      }
    }

    const newItemsTotal = items.reduce(
      (sum, i) => sum + Number(i.sale_price) * Number(i.quantity), 0
    );

    // Check for existing pending / partial loan
    const [[existingSale]] = await db.query(
      `SELECT id, total_amount, discount AS prev_discount, paid_amount AS prev_paid
       FROM sales
       WHERE customer_id = ?
         AND payment_type = 'loan'
         AND status IN ('pending', 'partial')
       ORDER BY created_at DESC
       LIMIT 1`,
      [customer_id]
    );

    let sale_id;
    let merged = false;

    if (existingSale) {
      sale_id = existingSale.id;
      merged  = true;

      await db.query(
        `UPDATE sales
         SET total_amount = ?,
             discount     = ?,
             paid_amount  = ?,
             notes        = CONCAT(COALESCE(notes, ''), ?)
         WHERE id = ?`,
        [
          Number(existingSale.total_amount) + newItemsTotal,
          Number(existingSale.prev_discount) + Number(discount),
          Number(existingSale.prev_paid)     + Number(paid_amount),
          notes ? `\n${notes}` : "",
          sale_id,
        ]
      );

      // ✅ NEW: update due_date on the existing loans row (if provided)
      if (due_date) {
        await db.query(
          `UPDATE loans SET due_date = ? WHERE sale_id = ?`,
          [due_date, sale_id]
        );
      }

    } else {
      const invoice_no = `LOAN-${Date.now()}`;
      const [result] = await db.query(
        `INSERT INTO sales
           (invoice_no, customer_id, total_amount, discount, paid_amount, payment_type, notes)
         VALUES (?, ?, ?, ?, ?, 'loan', ?)`,
        [invoice_no, customer_id, newItemsTotal, Number(discount), Number(paid_amount), notes]
      );
      sale_id = result.insertId;

      // ✅ NEW: set due_date on the newly created loans row (if provided)
      // The loans row is created by a trigger or SP after sales insert.
      // We update it right after to set due_date.
      if (due_date) {
        await db.query(
          `UPDATE loans SET due_date = ? WHERE sale_id = ?`,
          [due_date, sale_id]
        );
      }
    }

    // Insert sale_items + deduct stock
    for (const item of items) {
      const costPrice = item.Wholesale_Price
        ? Number(item.Wholesale_Price)
        : Number(item.selling_Price);

      await db.query(
        `INSERT INTO sale_items
           (sale_id, product_id, product_name, quantity, cost_price, sale_price, item_discount)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [sale_id, item.product_id, item.Product_Name, Number(item.quantity), costPrice, Number(item.sale_price)]
      );

      await db.query(
        `UPDATE available_products SET Quantity = Quantity - ? WHERE Ap_Id = ?`,
        [Number(item.quantity), item.Ap_Id]
      );
    }

    res.json({
      success: true,
      merged,
      sale_id,
      message: merged ? "Products added to existing loan" : "New product loan created",
    });
  } catch (err) {
    console.error("❌ /add-product-loan error:", err);
    res.status(500).json({ success: false, message: err.sqlMessage || err.message });
  }
});






export default router;
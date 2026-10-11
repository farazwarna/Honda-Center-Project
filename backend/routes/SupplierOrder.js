import express from "express";
import db from "../config/db.js";
import PDFDocument from "pdfkit";
import path from "path";

const router = express.Router();

router.get("/suppliers", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name
      FROM suppliers
      ORDER BY name ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/create", (req, res) => {
  const { name, phone, address, balance } = req.body;

  const sql = `
    INSERT INTO suppliers (name, phone, address, balance)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [name, phone, address, balance || 0], (err, result) => {
    if (err) return res.status(500).json(err);

    // OPTIONAL: create ledger entry if balance > 0
    if (balance >= 0) {
      const ledgerSql = `
        INSERT INTO supplier_payments (supplier_id, amount, type, note)
        VALUES (?, ?, 'opening', 'Opening Balance')
      `;

      db.query(ledgerSql, [result.insertId, balance]);
    }

    res.json({ message: "Supplier created" });
  });
});

/* ===============================
   🛒 CREATE ORDER
================================ */
router.post("/create-order", async (req, res) => {
  try {
    const { supplier_id, items } = req.body;

    const total = items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    // get supplier name
    const [[supplier]] = await db.query(
      "SELECT name FROM suppliers WHERE id=?",
      [supplier_id]
    );

    // create order — save supplier_id too
    const [order] = await db.query(
      `INSERT INTO supplier_orders (supplier_id, supplier_name, total_amount)
       VALUES (?, ?, ?)`,
      [supplier_id, supplier.name, total]
    );

    const orderId = order.insertId;

    for (let item of items) {
      await db.query(
        `INSERT INTO supplier_order_items
        (order_id, product_id, quantity, price)
        VALUES (?,?,?,?)`,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    // ❌ REMOVED: supplier balance update
    // ❌ REMOVED: ledger entry
    // ✅ These now happen in receive-order

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

/* ===============================
   📦 GET ORDERS
================================ */
router.get("/get-orders", async (req, res) => {
  try {
    const [orders] = await db.query(
      "SELECT * FROM supplier_orders ORDER BY id DESC"
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json(err);
  }
});

/* ===============================
   📦 GET ORDER ITEMS
================================ */
router.get("/get-order-items/:id", async (req, res) => {
  try {
    const [data] = await db.query(`
      SELECT 
        soi.product_id,
        p.Product_Name,
        soi.quantity,
        soi.received_qty,
        (soi.quantity - soi.received_qty) AS remaining,
        soi.price
      FROM supplier_order_items soi
      JOIN products p ON p.Product_Id = soi.product_id
      WHERE soi.order_id = ?
    `, [req.params.id]);

    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error loading items" });
  }
});

/* ===============================
   📥 RECEIVE ORDER (FULL / PARTIAL)
================================ */
router.post("/receive-order", async (req, res) => {
  const { order_id, items } = req.body;

  try {
    if (!order_id || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid request" });
    }

    // =========================
    // GET ORDER + SUPPLIER ID
    // =========================
    const [orderRows] = await db.query(
      `SELECT id, supplier_id FROM supplier_orders WHERE id = ?`,
      [order_id]
    );

    if (!orderRows.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    const supplier_id = orderRows[0].supplier_id;

    let total = 0;

    // =========================
    // PROCESS ITEMS
    // =========================
    for (const item of items) {
      const product_id = item.product_id;
      const received_qty = Number(item.received_qty || 0);

      if (received_qty <= 0) continue;

      const [orderItem] = await db.query(
        `SELECT quantity, received_qty, price
         FROM supplier_order_items
         WHERE order_id = ? AND product_id = ?`,
        [order_id, product_id]
      );

      if (!orderItem.length) continue;

      const data = orderItem[0];

      const remaining =
        Number(data.quantity || 0) - Number(data.received_qty || 0);

      const safeQty = Math.min(received_qty, remaining);

      if (safeQty <= 0) continue;

      const price = Number(data.price || 0);
      total += safeQty * price;

      // STOCK UPDATE
      await db.query(
        `UPDATE available_products
         SET Quantity = Quantity + ?
         WHERE product_id = ?`,
        [safeQty, product_id]
      );

      // ORDER ITEM UPDATE
      await db.query(
        `UPDATE supplier_order_items
         SET received_qty = received_qty + ?
         WHERE order_id = ? AND product_id = ?`,
        [safeQty, order_id, product_id]
      );
    }

    // =========================
    // CHECK ORDER STATUS
    // =========================
    const [rows] = await db.query(
      `SELECT quantity, received_qty, price
       FROM supplier_order_items
       WHERE order_id = ?`,
      [order_id]
    );

    let complete = true;
    let remainingAmount = 0;

    for (const r of rows) {
      const rem = Number(r.quantity) - Number(r.received_qty);
      if (rem > 0) {
        complete = false;
        remainingAmount += rem * Number(r.price || 0);
      }
    }

    await db.query(
      `UPDATE supplier_orders
       SET status = ?, total_amount = ?
       WHERE id = ?`,
      [complete ? "received" : "ordered", remainingAmount, order_id]
    );

    // =========================
    // ✅ SUPPLIER BALANCE UPDATE (moved from create-order)
    // =========================
    if (total > 0 && supplier_id) {
      await db.query(
        `UPDATE suppliers 
         SET balance = balance + ? 
         WHERE id = ?`,
        [total, supplier_id]
      );

      // ✅ LEDGER ENTRY (moved from create-order)
      await db.query(
        `INSERT INTO supplier_ledger 
         (supplier_id, type, reference_id, debit, balance)
         VALUES (?, 'purchase', ?, ?, 
         (SELECT balance FROM suppliers WHERE id = ?))`,
        [supplier_id, order_id, total, supplier_id]
      );
    }

    // =========================
    // RESPONSE
    // =========================
    res.json({
      success: true,
      message: "Order processed",
      total_received_value: total,
    });

  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   💰 PAY SUPPLIER
================================ */
router.post("/pay-supplier", async (req, res) => {
  try {
    const { supplier_id, amount, payment_method, notes } = req.body;

    if (!supplier_id || !amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid data" });
    }

    const [[result]] = await db.query(`
      SELECT IFNULL(SUM(debit - credit), 0) AS balance
      FROM supplier_ledger
      WHERE supplier_id = ?
    `, [supplier_id]);

    let currentBalance = Number(result.balance || 0);
    let newBalance = currentBalance - amount;

    await db.query(`
      UPDATE suppliers SET balance = ? WHERE id = ?
    `, [newBalance, supplier_id]);

    await db.query(`
      INSERT INTO supplier_ledger
      (supplier_id, type, debit, credit, balance)
      VALUES (?, 'payment', 0, ?, ?)
    `, [supplier_id, amount, newBalance]);

    res.json({
      success: true,
      message: "Payment recorded successfully",
      previousBalance: currentBalance,
      paid: amount,
      newBalance: newBalance,
      isAdvance: newBalance < 0
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   📋 SUPPLIER CREDIT
================================ */
router.get("/supplier-credit", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name, phone, balance
      FROM suppliers
      ORDER BY balance DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

/* ===============================
   📒 SUPPLIER LEDGER
================================ */
router.get("/supplier-ledger/:id", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT type, debit, credit, balance, created_at
      FROM supplier_ledger
      WHERE supplier_id = ?
      ORDER BY created_at DESC
    `, [req.params.id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

/* ===============================
   🧾 STATEMENT PDF
================================ */
router.get("/statement-pdf/:id", async (req, res) => {
  try {
    const supplierId = req.params.id;
    const { from, to } = req.query;

    const [[supplier]] = await db.query(
      "SELECT * FROM suppliers WHERE id = ?",
      [supplierId]
    );

    const [[openingRow]] = await db.query(`
      SELECT IFNULL(SUM(debit - credit),0) AS opening
      FROM supplier_ledger
      WHERE supplier_id = ?
      AND DATE(created_at) < ?
    `, [supplierId, from]);

    let openingBalance = parseFloat(openingRow.opening) || 0;

    const [ledger] = await db.query(`
      SELECT type, debit, credit, created_at
      FROM supplier_ledger
      WHERE supplier_id = ?
      AND DATE(created_at) BETWEEN ? AND ?
      ORDER BY created_at ASC
    `, [supplierId, from, to]);

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Supplier_${supplier.name}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    try {
      const logoPath = path.join("uploads", "logo.png");
      doc.image(logoPath, 40, 20, { width: 70 });
    } catch (err) {
      console.log("Logo not found");
    }

    doc.fontSize(18).text("Supplier Statement", { align: "center" });
    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Supplier: ${supplier.name}`);
    doc.text(`Phone: ${supplier.phone || "-"}`);
    doc.text(`From: ${from}  To: ${to}`);
    doc.text(`Opening Balance: ${openingBalance}`);
    doc.moveDown();

    let y = doc.y;
    doc.fontSize(10);
    doc.text("Date", 40, y);
    doc.text("Type", 140, y);
    doc.text("Debit", 240, y);
    doc.text("Credit", 320, y);
    doc.text("Balance", 420, y);
    y += 20;

    let runningBalance = openingBalance;
    let totalDebit = 0;
    let totalCredit = 0;

    ledger.forEach((row) => {
      const debit = parseFloat(row.debit) || 0;
      const credit = parseFloat(row.credit) || 0;

      runningBalance += debit - credit;
      totalDebit += debit;
      totalCredit += credit;

      doc.text(new Date(row.created_at).toLocaleDateString(), 40, y);
      doc.text(row.type || "-", 140, y);
      doc.text(debit.toFixed(2), 240, y);
      doc.text(credit.toFixed(2), 320, y);
      doc.text(runningBalance.toFixed(2), 420, y);

      y += 18;

      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    doc.moveDown(2);
    doc.fontSize(11).text("SUMMARY", { underline: true });
    doc.moveDown(0.5);
    doc.text(`Total Debit: ${totalDebit.toFixed(2)}`);
    doc.text(`Total Credit: ${totalCredit.toFixed(2)}`);
    doc.text(`Closing Balance: ${runningBalance.toFixed(2)}`);
    doc.moveDown(3);
    doc.text("Prepared By: ____________________", 40);
    doc.text("Authorized Signature: ____________", 300);

    doc.end();

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/ping", (req, res) => {
  res.json({ message: "Supplier route working" });
});




/* ===============================
   ❌ CANCEL ORDER
================================ */
router.post("/cancel-order", async (req, res) => {
  const { order_id } = req.body;

  try {
    if (!order_id) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const [orderRows] = await db.query(
      `SELECT id, status FROM supplier_orders WHERE id = ?`,
      [order_id]
    );

    if (!orderRows.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    await db.query(
      `UPDATE supplier_orders SET status = 'cancelled' WHERE id = ?`,
      [order_id]
    );

    res.json({ success: true, message: "Order cancelled" });

  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});





/* ===============================
   🧾 ORDER PDF
================================ */
router.get("/order-pdf/:id", async (req, res) => {
  try {
    const orderId = req.params.id;

    // GET ORDER
    const [[order]] = await db.query(
      `SELECT * FROM supplier_orders WHERE id = ?`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // GET ITEMS
    const [items] = await db.query(
      `SELECT 
        soi.product_id,
        p.Product_Name,
        soi.quantity,
        soi.received_qty,
        (soi.quantity - soi.received_qty) AS remaining,
        soi.price,
        (soi.quantity * soi.price) AS total
       FROM supplier_order_items soi
       JOIN products p ON p.Product_Id = soi.product_id
       WHERE soi.order_id = ?`,
      [orderId]
    );

    // PDF SETUP
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Order_${orderId}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // LOGO
    try {
      const logoPath = path.join("static", "atlas.png");
      doc.image(logoPath, 40, 20, { width: 70 });
    } catch (err) {
      console.log("Logo not found");
    }

    // ===============================
    // HEADER
    // ===============================
    doc.fontSize(20).font("Helvetica-Bold")
       .text("Fawad Honda Center", { align: "center" });
    doc.moveDown(0.5);

    // STATUS BADGE LINE
    doc.fontSize(11).font("Helvetica")
       .text(`Status: ${order.status.toUpperCase()}`, { align: "center" });

    doc.moveDown(1);

    // ===============================
    // ORDER INFO BOX
    // ===============================
    doc.fontSize(11).font("Helvetica-Bold").text("Order Details");
    doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown(0.4);

    doc.font("Helvetica").fontSize(10);
    doc.text(`Order ID   : #${order.id}`);
    doc.text(`Date       : ${new Date(order.created_at).toLocaleDateString("en-PK", {
      year: "numeric", month: "long", day: "numeric"
    })}`);
    doc.text(`Supplier   : ${order.supplier_name}`);
    doc.text(`Status     : ${order.status}`);
    doc.text(`Total      : Rs ${Number(order.total_amount).toLocaleString()}`);

    doc.moveDown(1);

    // ===============================
    // ITEMS TABLE HEADER
    // ===============================
    doc.fontSize(11).font("Helvetica-Bold").text("Order Items");
    doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown(0.4);

    let y = doc.y;

    // column headers
    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("#",          40,  y);
    doc.text("Product",    60,  y);
    doc.text("Price",      230, y);
    doc.text("Ordered",    290, y);
    doc.text("Received",   360, y);
    doc.text("Remaining",  430, y);
    doc.text("Total",      500, y);

    y += 16;
    doc.moveTo(40, y).lineTo(560, y).stroke();
    y += 6;

    // ===============================
    // ITEMS ROWS
    // ===============================
    doc.font("Helvetica").fontSize(9);

    items.forEach((item, idx) => {
      // page break safety
      if (y > 720) {
        doc.addPage();
        y = 50;
      }

      doc.text(String(idx + 1),                          40,  y);
      doc.text(item.Product_Name,                        60,  y, { width: 160 });
      doc.text(`Rs ${Number(item.price).toLocaleString()}`,      230, y);
      doc.text(String(item.quantity),                    290, y);
      doc.text(String(item.received_qty),                360, y);
      doc.text(String(item.remaining),                   430, y);
      doc.text(`Rs ${Number(item.total).toLocaleString()}`,      500, y);

      y += 20;
    });

    // ===============================
    // TOTALS LINE
    // ===============================
    y += 4;
    doc.moveTo(40, y).lineTo(560, y).stroke();
    y += 8;

    doc.fontSize(10).font("Helvetica-Bold");
    doc.text(`Order Total: Rs ${Number(order.total_amount).toLocaleString()}`, 400, y);

    // ===============================
    // FOOTER
    // ===============================
    doc.moveDown(4);
    doc.fontSize(9).font("Helvetica").fillColor("gray")
       .text("Fawad Honda Center", { align: "center" });

    doc.end();

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
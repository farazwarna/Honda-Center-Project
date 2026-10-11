import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* ===============================
   📊 DASHBOARD STATS
================================ */
router.get("/dashboard-stats", async (req, res) => {

  try {

    // ========== KPI ==========
    const [[totalProducts]] = await db.query(
      `SELECT COUNT(*) AS count FROM products`
    );

    const [[totalStock]] = await db.query(
      `SELECT IFNULL(SUM(Quantity), 0) AS total FROM available_products`
    );

    const [[lowStock]] = await db.query(
      `SELECT COUNT(*) AS count
       FROM available_products ap
       JOIN products p ON p.Product_Id = ap.product_id
       WHERE ap.Quantity < p.Min_Stock`
    );

    const [[suppliersOwed]] = await db.query(
      `SELECT IFNULL(SUM(balance), 0) AS total FROM suppliers`
    );

    // ========== ORDER STATUS COUNTS ==========
    const [orderCounts] = await db.query(
      `SELECT status, COUNT(*) AS count
       FROM supplier_orders
       GROUP BY status`
    );

    const orders = { ordered: 0, partial: 0, received: 0, cancelled: 0 };
    orderCounts.forEach((r) => { orders[r.status] = r.count; });

    // ========== LOW STOCK PRODUCTS ==========
    // ✅ FIX: added p.Product_Id and p.Product_Price
    //    Without these two columns the frontend cart builder
    //    had no id to key on and no price to show — both came through as undefined → 0
    const [lowStockProducts] = await db.query(
      `SELECT
         p.Product_Id,
         p.Product_Name,
         p.Product_Price,
         p.Min_Stock,
         ap.Quantity
       FROM available_products ap
       JOIN products p ON p.Product_Id = ap.product_id
       WHERE ap.Quantity < p.Min_Stock
       ORDER BY ap.Quantity ASC
       LIMIT 5`
    );

    // ========== SUPPLIER BALANCES ==========
    const [supplierBalances] = await db.query(
      `SELECT name, balance
       FROM suppliers
       ORDER BY balance DESC`
    );

    // ========== RECENT ORDERS ==========
    const [recentOrders] = await db.query(
      `SELECT id, supplier_name, status, total_amount, created_at
       FROM supplier_orders
       ORDER BY id DESC
       LIMIT 5`
    );

    // ========== LEDGER SUMMARY ==========
    const [[ledger]] = await db.query(
      `SELECT
         IFNULL(SUM(debit), 0)          AS total_debit,
         IFNULL(SUM(credit), 0)         AS total_credit,
         IFNULL(SUM(debit - credit), 0) AS outstanding
       FROM supplier_ledger`
    );

    // ========== STOCK VALUE ==========
    const [[stockValue]] = await db.query(
      `SELECT
         SUM(ap.quantity * ap.selling_price)   AS selling_value,
         SUM(ap.quantity * p.Product_Price)    AS product_cost,
         SUM(ap.quantity * ap.wholesale_price) AS wholesale_value
       FROM available_products ap
       JOIN products p ON p.Product_Id = ap.product_id`
    );

    res.json({
      kpi: {
        totalProducts: totalProducts.count,
        totalStock:    totalStock.total,
        lowStock:      lowStock.count,
        suppliersOwed: suppliersOwed.total,
      },
      orders,
      lowStockProducts,
      supplierBalances,
      recentOrders,
      ledger,
      stockValue,
    });

  } catch (err) {
    console.log("Dashboard error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
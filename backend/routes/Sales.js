import express from 'express'
import db from '../config/db.js';




const router=express.Router()




router.get("/getAllSales", async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", filter, from, to } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";

    // 🔍 SEARCH CUSTOMER
    if (search) {
      where += ` AND c.name LIKE '%${search}%'`;
    }

    // 📅 FILTERS
    if (filter === "today") {
      where += " AND DATE(s.created_at) = CURDATE()";
    }

    if (filter === "yesterday") {
      where += " AND DATE(s.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
    }

    if (filter === "month") {
      where += " AND MONTH(s.created_at) = MONTH(CURDATE())";
    }

    // 📆 DATE RANGE
    if (from && to) {
      where += ` AND DATE(s.created_at) BETWEEN '${from}' AND '${to}'`;
    }

    // 📦 MAIN QUERY
    const [data] = await db.query(
      `
      SELECT 
        s.id,
        c.name AS customer_name,
        s.total_amount,
        s.discount,
        s.paid_amount,
        s.payment_type,
        s.status,
        s.created_at
      FROM sales s
      LEFT JOIN customers c ON c.customer_id = s.customer_id
      ${where}
      ORDER BY s.id DESC
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    // 📊 COUNT QUERY
    const [countResult] = await db.query(
      `
      SELECT COUNT(*) as total
      FROM sales s
      LEFT JOIN customers c ON c.customer_id = s.customer_id
      ${where}
      `
    );

    const total = countResult[0].total;

    res.json({
      data,
      totalPages: Math.ceil(total / limit),
      page,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});


// ============================
// 🧾 GET SALE ITEMS (MODAL)
// ============================
router.get("/getSaleItems/:id", async (req, res) => {
  try {
    const { id } = req.params;

   const [items] = await db.query(
  `
  SELECT 
  p.Product_Id,
    p.Product_Name,
    si.quantity,
    ap.selling_Price AS price,
    (si.quantity * ap.selling_Price) AS total
  FROM sale_items si
  JOIN products p ON p.Product_Id = si.product_id
  JOIN available_products ap ON ap.product_id = si.product_id
  WHERE si.sale_id = ?
  `,
  [id]
);

    res.json(items);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching items" });
  }
});


export default router
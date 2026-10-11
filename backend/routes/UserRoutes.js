import express from "express";
import db from "../config/db.js";

const router = express.Router();


// ============================
// 📦 SCAN / SELL PRODUCT (QR)
// ============================
router.get("/sellProducts/:qr", async (req, res) => {
  try {
    const qr = req.params.qr;

    const sql = `
      SELECT 
        p.Product_Id,
        p.Product_Name,
        p.Product_Price,
        ap.selling_Price,
        ap.Wholesale_Price,
        ap.Quantity AS stock
      FROM available_products ap
      INNER JOIN products p ON ap.product_id = p.Product_Id
      WHERE p.Product_Key = ?
    `;

    const [result] = await db.query(sql, [qr]);

    if (result.length === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(result[0]);

  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});


router.get("/searchProducts", async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const searchTerm = `%${q.trim()}%`;
    
    const [rows] = await db.query(
      `SELECT 
        p.Product_Id,
        p.Product_Name,
        p.Product_Price,
        ap.selling_Price,
        ap.Wholesale_Price,
        ap.Quantity AS stock
      FROM available_products ap
      INNER JOIN products p ON ap.product_id = p.Product_Id
      WHERE p.Product_Name LIKE ?
      LIMIT 10`,
      [searchTerm]
    );
    
    res.json(rows);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ 
      error: "Search failed", 
      detail: err.message 
    });
  }
});



// ============================
// 🧾 CREATE SALE
// ============================
router.post("/createSale", async (req, res) => {
  const {
    customer_id = 0,
    customer_type = "retail",
    customer_name,
    p_phone,
    p_address,
    discount = 0,
    paid = 0,
    payment_type,
    due_date,       // ✅ received from frontend
    items,
  } = req.body;

  if (!items || items.length === 0)
    return res.status(400).json({ message: "No items provided" });

  if (payment_type === "loan" && !due_date)
    return res.status(400).json({ message: "Due date required for loan sales" });

  const processedItems = items.map((item) => ({
    product_id: item.product_id,
    quantity: parseInt(item.quantity, 10),
    item_discount: parseFloat(item.item_discount || 0),
    customer_type,
  }));

  try {
    const [resultSets] = await db.execute(
      `CALL Create_newSale_FINAL(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_id || 0,
        customer_name || null,
        p_phone || null,
        p_address || null,
        parseFloat(discount),
        parseFloat(paid),
        payment_type,
        due_date || null,             // ✅ passed to stored procedure
        JSON.stringify(processedItems),
      ]
    );

    const sale = resultSets[0][0];

    res.json({
      message: "Sale completed successfully",
      ...sale,
    });

  } catch (err) {
    console.error("createSale error:", err);
    res.status(500).json({
      message: err.sqlMessage || err.message || "Internal server error",
    });
  }
});


// ============================
// 📊 DASHBOARD STATS
// ============================
// router.get("/dashboard-stats", async (req, res) => {
//   try {
//     // 💰 TOTAL CASH RECEIVED TODAY
//     const [cashSales] = await db.query(`
//       SELECT 
//         IFNULL(SUM(CASE 
//           WHEN s.payment_type = 'cash' AND DATE(s.created_at) = CURDATE()
//           THEN s.net_amount
//           ELSE 0 
//         END), 0)
//         + IFNULL(
//             (SELECT SUM(lp.amount)
//              FROM loan_payments lp
//              WHERE DATE(lp.created_at) = CURDATE()
//             ), 0
//           )
//         - IFNULL(
//             (SELECT SUM(ri.quantity * ri.sale_price)
//              FROM returns r
//              JOIN return_items ri ON ri.return_id = r.return_id
//              JOIN sales s2 ON s2.id = r.sale_id
//              WHERE r.status = 'approved'
//              AND s2.payment_type = 'cash'
//              AND DATE(r.created_at) = CURDATE()
//             ), 0
//           ) AS totalCashSales
//       FROM sales s
//     `);

//     // 📊 BREAKDOWN: Cash from sales vs loan payments
//     const [cashBreakdown] = await db.query(`
//       SELECT 
//         IFNULL(SUM(CASE 
//           WHEN s.payment_type = 'cash' AND DATE(s.created_at) = CURDATE()
//           THEN s.net_amount
//           ELSE 0 
//         END), 0) AS directCashSales,
//         IFNULL(
//           (SELECT SUM(lp.amount)
//            FROM loan_payments lp
//            WHERE DATE(lp.created_at) = CURDATE()
//           ), 0
//         ) AS loanPaymentsReceived
//       FROM sales s
//     `);

//     // 📉 OUTSTANDING LOANS
//     const [loanSales] = await db.query(`
//       SELECT 
//         IFNULL(SUM(s.remaining_amount), 0)
//         - IFNULL(
//           (SELECT SUM(ri.quantity * ri.sale_price)
//            FROM returns r
//            JOIN return_items ri ON ri.return_id = r.return_id
//            JOIN sales s2 ON s2.id = r.sale_id
//            WHERE r.status = 'approved'
//            AND s2.payment_type = 'loan'
//            AND DATE(r.created_at) = CURDATE()), 0
//         ) AS totalLoan
//       FROM sales s
//       WHERE s.payment_type = 'loan'
//       AND DATE(s.created_at) = CURDATE()
//     `);

//     // 📈 PROFIT — ✅ FIXED: compute from columns instead of missing profit column
//     const [profit] = await db.query(`
//       SELECT 
//         IFNULL(SUM((si.sale_price - si.item_discount - si.cost_price) * si.quantity), 0)
//         - IFNULL(
//           (SELECT SUM(ri.quantity * (ri.sale_price - p.Product_Price))
//            FROM returns r
//            JOIN return_items ri ON ri.return_id = r.return_id
//            JOIN products p ON p.Product_Id = ri.product_id
//            WHERE r.status = 'approved'
//            AND DATE(r.created_at) = CURDATE()), 0
//         ) AS totalProfit
//       FROM sale_items si
//       JOIN sales s ON s.id = si.sale_id
//       WHERE DATE(s.created_at) = CURDATE()
//     `);

//     // 💸 TOTAL EXPENSES TODAY
//     const [expenses] = await db.query(`
//       SELECT 
//         IFNULL(SUM(amount), 0) AS totalExpenses,
//         COUNT(*) AS expenseCount
//       FROM expenses
//       WHERE date = CURDATE()
//     `);

//     // ⚠️ LOW STOCK PRODUCTS
//     const [lowStock] = await db.query(`
//       SELECT 
//         p.Product_Name AS name, 
//         ap.Quantity AS qty,
//         ap.selling_Price AS price
//       FROM available_products ap
//       JOIN products p ON p.Product_Id = ap.product_id
//       WHERE ap.Quantity <= 5 AND ap.Quantity > 0
//       ORDER BY ap.Quantity ASC
//       LIMIT 10
//     `);

//     // 🔥 TOP SELLING ITEMS TODAY
//     const [topItems] = await db.query(`
//       SELECT 
//         p.Product_Name AS name, 
//         SUM(si.quantity) AS qty,
//         SUM((si.sale_price - si.item_discount - si.cost_price) * si.quantity) AS profit
//       FROM sale_items si
//       JOIN sales s ON s.id = si.sale_id
//       JOIN products p ON p.Product_Id = si.product_id
//       WHERE DATE(s.created_at) = CURDATE()
//       GROUP BY si.product_id
//       ORDER BY qty DESC
//       LIMIT 5
//     `);

//     // 📦 RETURNS TODAY
//     const [returns] = await db.query(`
//       SELECT 
//         IFNULL(SUM(ri.quantity * ri.sale_price), 0) AS totalReturns,
//         COUNT(DISTINCT r.return_id) AS returnCount
//       FROM returns r
//       JOIN return_items ri ON ri.return_id = r.return_id
//       WHERE r.status = 'approved'
//       AND DATE(r.created_at) = CURDATE()
//     `);

//     // 💵 LOAN PAYMENTS SUMMARY
//     const [loanPayments] = await db.query(`
//       SELECT 
//         IFNULL(SUM(lp.amount), 0) AS totalLoanPayments,
//         COUNT(DISTINCT lp.loan_id) AS paymentCount,
//         COUNT(*) AS transactionCount
//       FROM loan_payments lp
//       WHERE DATE(lp.created_at) = CURDATE()
//     `);

//     // 📊 SALES SUMMARY
//     const [salesSummary] = await db.query(`
//       SELECT 
//         COUNT(*) AS totalSales,
//         SUM(CASE WHEN payment_type = 'cash' THEN 1 ELSE 0 END) AS cashSales,
//         SUM(CASE WHEN payment_type = 'loan' THEN 1 ELSE 0 END) AS loanSales
//       FROM sales
//       WHERE DATE(created_at) = CURDATE()
//     `);

//     // 🎯 PENDING LOANS OVERVIEW
//     const [pendingLoans] = await db.query(`
//       SELECT 
//         COUNT(*) AS totalPendingLoans,
//         SUM(remaining_amount) AS totalPendingAmount
//       FROM loans
//       WHERE status IN ('unpaid', 'partial')
//     `);

//     res.json({
//       totalCashSales: Math.max(0, cashSales[0].totalCashSales),
//       directCashSales: cashBreakdown[0].directCashSales,
//       loanPaymentsReceived: cashBreakdown[0].loanPaymentsReceived,
//       totalLoan: Math.max(0, loanSales[0].totalLoan),
//       profit: profit[0].totalProfit,
//       netProfit: profit[0].totalProfit - (expenses[0].totalExpenses || 0),
//       totalExpenses: expenses[0].totalExpenses || 0,
//       expenseCount: expenses[0].expenseCount || 0,
//       lowStock,
//       mostSoldItems: topItems,
//       totalReturns: returns[0].totalReturns || 0,
//       returnCount: returns[0].returnCount || 0,
//       totalLoanPayments: loanPayments[0].totalLoanPayments || 0,
//       loanPaymentCount: loanPayments[0].paymentCount || 0,
//       loanTransactionCount: loanPayments[0].transactionCount || 0,
//       totalSales: salesSummary[0].totalSales || 0,
//       cashSalesCount: salesSummary[0].cashSales || 0,
//       loanSalesCount: salesSummary[0].loanSales || 0,
//       totalPendingLoans: pendingLoans[0].totalPendingLoans || 0,
//       totalPendingAmount: pendingLoans[0].totalPendingAmount || 0,
//     });

//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ error: "Dashboard error" });
//   }
// });





// ============================================================
// UPDATED DASHBOARD STATS ROUTE
// Drop this into your existing router file (e.g. userRoutes.js)
// Usage: GET /User/dashboard-stats?date=YYYY-MM-DD
//        (defaults to today if no date provided)
// ============================================================


/* ─── Helpers ─── */
const todayISO = () => new Date().toISOString().split("T")[0];

const num = (v, def = 0) => {
  const n = parseFloat(v);
  return isNaN(n) ? def : n;
};

const int = (v, def = 0) => {
  const n = parseInt(v, 10);
  return isNaN(n) ? def : n;
};

/* ─── Validation middleware ─── */
const validateDate = (req, res, next) => {
  const date = req.query.date || todayISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Invalid date. Use YYYY-MM-DD." });
  }
  if (date > todayISO()) {
    return res.status(400).json({ error: "Date cannot be in the future." });
  }
  req.validatedDate = date;
  next();
};

/* ─── Route ─── */
router.get("/dashboard-stats", validateDate, async (req, res) => {
  const date = req.validatedDate;

  try {
    /* Fire all independent reads in parallel */
    const [
      [salesSummary],
      [loanPayments],
      [returns],
      [profit],
      [returnProfitData],
      [expenses],
      [pendingLoans],
      [stockAlerts],
      [topItems],
      [topCustomers],
      [hourlySales],
      [recentPayments],
      [expenseBreakdown],
    ] = await Promise.all([
      /* 1. Sales, cash sales, loan sales, revenue (replaces queries 1, 6, 12) */
      db.query(
        `SELECT 
          COUNT(*) AS totalSales,
          SUM(CASE WHEN payment_type='cash' THEN 1 ELSE 0 END) AS cashSalesCount,
          SUM(CASE WHEN payment_type='loan'  THEN 1 ELSE 0 END) AS loanSalesCount,
          IFNULL(SUM(CASE WHEN payment_type='cash' THEN net_amount ELSE 0 END), 0) AS directCashSales,
          IFNULL(SUM(CASE WHEN payment_type='loan' THEN net_amount ELSE 0 END), 0) AS totalLoanAmount,
          IFNULL(SUM(CASE WHEN payment_type='loan' THEN remaining_amount ELSE 0 END), 0) AS totalLoanRemaining,
          IFNULL(SUM(net_amount), 0) AS totalRevenue
         FROM sales
         WHERE DATE(created_at) = ?`,
        [date]
      ),

      /* 2. Loan payments received today */
      db.query(
        `SELECT 
          IFNULL(SUM(amount), 0) AS loanPaymentsReceived,
          COUNT(DISTINCT loan_id) AS loanPaymentCount,
          COUNT(*) AS loanTransactionCount
         FROM loan_payments
         WHERE DATE(created_at) = ?`,
        [date]
      ),

      /* 3. Returns: cash-only + total + count (replaces queries 3 & 11) */
      db.query(
        `SELECT 
          IFNULL(SUM(CASE WHEN s.payment_type = 'cash' THEN ri.quantity * ri.sale_price ELSE 0 END), 0) AS cashReturns,
          IFNULL(SUM(ri.quantity * ri.sale_price), 0) AS totalReturns,
          COUNT(DISTINCT r.return_id) AS returnCount
         FROM returns r
         JOIN return_items ri ON ri.return_id = r.return_id
         LEFT JOIN sales s ON s.id = r.sale_id
         WHERE r.status = 'approved' AND DATE(r.created_at) = ?`,
        [date]
      ),

      /* 4. 3-tier profit in one shot (replaces queries 7, 8, 9) */
      db.query(
        `SELECT 
          SUM(CASE WHEN s.payment_type = 'cash' THEN (si.sale_price - si.item_discount - si.cost_price) * si.quantity ELSE 0 END) AS cashProfit,
          SUM(CASE WHEN s.payment_type = 'loan' AND l.status = 'paid' THEN (si.sale_price - si.item_discount - si.cost_price) * si.quantity ELSE 0 END) AS paidLoanProfit,
          SUM(CASE WHEN s.payment_type = 'loan' AND l.status IN ('unpaid','partial') THEN (si.sale_price - si.item_discount - si.cost_price) * si.quantity ELSE 0 END) AS pendingProfit
         FROM sale_items si
         JOIN sales s ON s.id = si.sale_id
         LEFT JOIN loans l ON l.sale_id = s.id
         WHERE DATE(s.created_at) = ?`,
        [date]
      ),

      /* 5. Profit deduction from approved returns */
      db.query(
        `SELECT IFNULL(SUM(ri.quantity * (ri.sale_price - p.Product_Price)), 0) AS returnProfit
         FROM returns r
         JOIN return_items ri ON ri.return_id = r.return_id
         JOIN products p ON p.Product_Id = ri.product_id
         WHERE r.status = 'approved' AND DATE(r.created_at) = ?`,
        [date]
      ),

      /* 6. Expenses summary */
      db.query(
        `SELECT IFNULL(SUM(amount), 0) AS totalExpenses, COUNT(*) AS expenseCount
         FROM expenses
         WHERE date = ?`,
        [date]
      ),

      /* 7. Overall pending loans (all-time) */
      db.query(
        `SELECT 
          COUNT(*) AS totalPendingLoans,
          IFNULL(SUM(remaining_amount), 0) AS totalPendingAmount,
          COUNT(CASE WHEN status='unpaid'  THEN 1 END) AS unpaidCount,
          COUNT(CASE WHEN status='partial' THEN 1 END) AS partialCount
         FROM loans
         WHERE status IN ('unpaid','partial')`
      ),

      /* 8. Low / out of stock combined (replaces 14 & 15) */
      db.query(
        `SELECT 
          p.Product_Name AS name,
          ap.Quantity AS qty,
          ap.selling_Price AS price,
          p.Min_Stock AS minStock
         FROM available_products ap
         JOIN products p ON p.Product_Id = ap.product_id
         WHERE ap.Quantity <= p.Min_Stock
         ORDER BY ap.Quantity ASC
         LIMIT 15`
      ),

      /* 9. Top selling items */
      db.query(
        `SELECT 
          p.Product_Name AS name,
          SUM(si.quantity) AS qty,
          SUM((si.sale_price - si.item_discount - si.cost_price) * si.quantity) AS profit,
          SUM(si.subtotal) AS revenue
         FROM sale_items si
         JOIN sales s ON s.id = si.sale_id
         JOIN products p ON p.Product_Id = si.product_id
         WHERE DATE(s.created_at) = ?
         GROUP BY si.product_id
         ORDER BY qty DESC
         LIMIT 5`,
        [date]
      ),

      /* 10. Top customers */
      db.query(
        `SELECT 
          c.name,
          IFNULL(SUM(s.net_amount), 0) AS totalPurchased,
          COUNT(s.id) AS orderCount
         FROM sales s
         JOIN customers c ON c.customer_id = s.customer_id
         WHERE DATE(s.created_at) = ?
         GROUP BY s.customer_id
         ORDER BY totalPurchased DESC
         LIMIT 5`,
        [date]
      ),

      /* 11. Hourly trend */
      db.query(
        `SELECT 
          HOUR(created_at) AS hour,
          COUNT(*) AS salesCount,
          IFNULL(SUM(net_amount), 0) AS revenue
         FROM sales
         WHERE DATE(created_at) = ?
         GROUP BY HOUR(created_at)
         ORDER BY hour`,
        [date]
      ),

      /* 12. Recent loan payments */
      db.query(
        `SELECT 
          lp.amount, lp.payment_method, lp.created_at,
          c.name AS customer_name, lp.loan_type
         FROM loan_payments lp
         JOIN customers c ON c.customer_id = lp.customer_id
         WHERE DATE(lp.created_at) = ?
         ORDER BY lp.created_at DESC
         LIMIT 5`,
        [date]
      ),

      /* 13. Expense breakdown */
      db.query(
        `SELECT category, IFNULL(SUM(amount), 0) AS amount, COUNT(*) AS count
         FROM expenses
         WHERE date = ?
         GROUP BY category
         ORDER BY amount DESC`,
        [date]
      ),
    ]);

    /* ─── Parse & calculate ─── */
    const s = salesSummary[0] || {};
    const lp = loanPayments[0] || {};
    const ret = returns[0] || {};
    const prof = profit[0] || {};
    const exp = expenses[0] || {};
    const pend = pendingLoans[0] || {};

    const directCashSales = num(s.directCashSales);
    const loanPaymentsReceived = num(lp.loanPaymentsReceived);
    const cashReturns = num(ret.cashReturns);
    const totalExpenses = num(exp.totalExpenses);
    const totalRevenue = num(s.totalRevenue);
    const totalSales = int(s.totalSales);

    const totalCashReceived = Math.max(
      0,
      directCashSales + loanPaymentsReceived - cashReturns - totalExpenses
    );

    const cashProfit = num(prof.cashProfit);
    const paidLoanProfit = num(prof.paidLoanProfit);
    const pendingLoanProfit = num(prof.pendingProfit);
    const returnProfit = num(returnProfitData[0]?.returnProfit);

    const realizedProfit = cashProfit + paidLoanProfit - returnProfit;
    const netProfit = realizedProfit - totalExpenses;
    const grossProfit = cashProfit + paidLoanProfit + pendingLoanProfit - returnProfit;

    // % of today's revenue that was collected in cash + loan repayments
    const collectionRate =
      totalRevenue > 0
        ? Math.min(
            100,
            ((directCashSales + loanPaymentsReceived) / totalRevenue) * 100
          ).toFixed(1)
        : 0;

    const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Split stock alerts for the frontend
    const allStock = stockAlerts || [];
    const lowStock = allStock.filter((i) => int(i.qty) > 0);
    const outOfStock = allStock.filter((i) => int(i.qty) === 0);

    /* ─── Response ─── */
    res.json({
      date,

      /* Cash flow */
      totalCashReceived,
      directCashSales,
      loanPaymentsReceived,
      cashReturns,
      totalExpenses,
      expenseCount: int(exp.expenseCount),
      expenseBreakdown: expenseBreakdown || [],

      /* Profit (3-tier) */
      grossProfit,
      realizedProfit,
      netProfit,
      cashProfit,
      paidLoanProfit,
      pendingLoanProfit,
      returnProfit,

      /* Sales */
      totalSales,
      cashSalesCount: int(s.cashSalesCount),
      loanSalesCount: int(s.loanSalesCount),
      totalRevenue,

      /* Loans given today */
      totalLoanGiven: num(s.totalLoanAmount),
      totalLoanRemaining: num(s.totalLoanRemaining),
      loanSalesCountToday: int(s.loanSalesCount),

      /* Loan payments received today */
      totalLoanPayments: loanPaymentsReceived,
      loanPaymentCount: int(lp.loanPaymentCount),
      loanTransactionCount: int(lp.loanTransactionCount),

      /* Overall pending (all time) */
      totalPendingLoans: int(pend.totalPendingLoans),
      totalPendingAmount: num(pend.totalPendingAmount),
      unpaidCount: int(pend.unpaidCount),
      partialCount: int(pend.partialCount),

      /* Returns */
      totalReturns: num(ret.totalReturns),
      returnCount: int(ret.returnCount),

      /* Lists */
      lowStock,
      outOfStock,
      mostSoldItems: topItems || [],
      recentPayments: recentPayments || [],
      topCustomers: topCustomers || [],
      hourlySales: hourlySales || [],

      /* Derived */
      collectionRate,
      avgSaleValue,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({
      error: "Dashboard error",
      detail: err.message,
    });
  }
});



export default router;
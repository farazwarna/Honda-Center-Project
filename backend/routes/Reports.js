import express from "express";
import db from "../config/db.js";

const router = express.Router();

const SHOP_NAME    = "Fawad Honda Center";
const SHOP_TAGLINE = "Genuine Honda Spare Parts & Accessories";

// ─── helpers ──────────────────────────────────────────────────────────────────
function dateBounds(q) {
  const from = q.from || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const to   = q.to   || new Date().toISOString().slice(0, 10);
  return { from, to };
}

const rs = (v) =>
  "Rs " + Number(v || 0).toLocaleString("en-PK", { minimumFractionDigits: 0 });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PK", {
    day: "2-digit", month: "short", year: "numeric",
  }) : "—";

// ─── exclude sales that have an approved return ───────────────────────────────
// Add this snippet into any WHERE clause that filters on sales:
//   AND s.id NOT IN (SELECT r.sale_id FROM returns r WHERE r.status = 'approved')
const NO_APPROVED_RETURNS = `AND s.id NOT IN (
  SELECT r.sale_id FROM returns r WHERE r.status = 'approved'
)`;

// ─── shared print CSS (Atlas Honda red/white/grey industrial theme) ────────────
const PRINT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600&display=swap');
  @page { size: A4; margin: 14mm 12mm 16mm; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Barlow', sans-serif; font-size: 10.5pt; color: #111; background: #fff; }

  .ph { display: flex; justify-content: space-between; align-items: stretch;
        background: #c8102e; color: #fff; border-radius: 6px;
        padding: 14px 18px; margin-bottom: 14px; }
  .ph-left { display: flex; flex-direction: column; justify-content: center; }
  .ph-logo { font-family: 'Barlow Condensed', sans-serif; font-size: 22pt;
             font-weight: 700; letter-spacing: 0.5px; line-height: 1; }
  .ph-tag  { font-size: 8pt; opacity: 0.82; margin-top: 3px; letter-spacing: .4px; }
  .ph-right { text-align: right; display: flex; flex-direction: column; justify-content: center; }
  .ph-rtitle { font-family: 'Barlow Condensed', sans-serif; font-size: 15pt;
               font-weight: 700; letter-spacing: .3px; line-height: 1.2; }
  .ph-rperiod { font-size: 8pt; opacity: 0.8; margin-top: 4px; }
  .ph-rprinted { font-size: 7.5pt; opacity: 0.65; margin-top: 2px; }

  .divider { height: 3px; background: linear-gradient(90deg,#c8102e 60%,#f3f4f6);
             border-radius: 2px; margin-bottom: 14px; }

  .sc-grid { display: grid; gap: 10px; margin-bottom: 16px; }
  .sc-grid-4 { grid-template-columns: repeat(4,1fr); }
  .sc-grid-3 { grid-template-columns: repeat(3,1fr); }
  .sc-grid-2 { grid-template-columns: repeat(2,1fr); }
  .sc { background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 6px;
        padding: 10px 13px; border-left: 4px solid #c8102e; }
  .sc-label { font-size: 7.5pt; font-weight: 600; text-transform: uppercase;
              letter-spacing: .8px; color: #6b7280; }
  .sc-value { font-family: 'Barlow Condensed', sans-serif; font-size: 16pt;
              font-weight: 700; color: #111; margin-top: 2px; }

  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 12px; }
  thead tr { background: #1a1a1a; color: #fff; }
  th { padding: 7px 10px; text-align: left; font-size: 8pt; font-weight: 600;
       text-transform: uppercase; letter-spacing: .6px; white-space: nowrap; }
  td { padding: 6px 10px; border-bottom: 1px solid #f0f0f0; }
  tr:nth-child(even) td { background: #fafafa; }
  tr:last-child td { border-bottom: none; }
  .tfoot td { font-weight: 700; background: #fff0f3; border-top: 2px solid #c8102e;
              font-size: 10pt; }
  .tr { text-align: right; }
  .tc { text-align: center; }

  .badge { display: inline-block; padding: 2px 7px; border-radius: 20px;
           font-size: 7.5pt; font-weight: 700; text-transform: uppercase; }
  .bg-green  { background: #d1fae5; color: #065f46; }
  .bg-red    { background: #fee2e2; color: #991b1b; }
  .bg-blue   { background: #dbeafe; color: #1e40af; }
  .bg-amber  { background: #fef9c3; color: #92400e; }
  .bg-gray   { background: #f3f4f6; color: #374151; }

  .profit { color: #059669; font-weight: 700; }
  .loss   { color: #c8102e; font-weight: 700; }
  .warn   { color: #d97706; font-weight: 700; }

  .note { font-size: 8.5pt; color: #6b7280; padding: 8px 12px;
          background: #fffbeb; border-left: 3px solid #f59e0b;
          border-radius: 4px; margin-bottom: 12px; }

  .pf { margin-top: 16px; padding-top: 8px;
        border-top: 1px solid #e5e7eb;
        display: flex; justify-content: space-between;
        font-size: 7.5pt; color: #9ca3af; }
  .pf-center { text-align: center; }
  .watermark { text-align: center; margin-top: 6px;
               font-family: 'Barlow Condensed', sans-serif;
               font-size: 9pt; color: #e5e7eb; letter-spacing: 2px; }
`;

function buildPrintPage({ title, period, summaryCardsHTML = "", tableHTML, noteHTML = "" }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${SHOP_NAME} — ${title}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  <div class="ph">
    <div class="ph-left">
      <div class="ph-logo">${SHOP_NAME}</div>
      <div class="ph-tag">${SHOP_TAGLINE}</div>
    </div>
    <div class="ph-right">
      <div class="ph-rtitle">${title}</div>
      <div class="ph-rperiod">Period: ${period}</div>
      <div class="ph-rprinted">Printed: ${new Date().toLocaleString("en-PK")}</div>
    </div>
  </div>
  <div class="divider"></div>
  ${summaryCardsHTML}
  ${noteHTML}
  ${tableHTML}
  <div class="pf">
    <span>${SHOP_NAME} &mdash; Confidential</span>
    <span class="pf-center">All amounts in Pakistani Rupees (Rs)</span>
    <span>Generated ${new Date().toLocaleString("en-PK")}</span>
  </div>
  <div class="watermark">${SHOP_NAME.toUpperCase()}</div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
}

function summaryCards(cards, cols = 4) {
  if (!cards.length) return "";
  const items = cards.map(c =>
    `<div class="sc"><div class="sc-label">${c.label}</div><div class="sc-value">${c.value}</div></div>`
  ).join("");
  return `<div class="sc-grid sc-grid-${cols}">${items}</div>`;
}

function tableHead(cols) {
  return `<thead><tr>${cols.map(c =>
    `<th${c.right ? ' class="tr"' : ""}>${c.label}</th>`
  ).join("")}</tr></thead>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// DATA ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// 1. Sales Summary — excludes approved returns
router.get("/sales-summary", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const [rows] = await db.execute(`
    SELECT DATE(s.created_at) AS sale_date,
      COUNT(DISTINCT s.id)  AS total_sales,
      SUM(s.total_amount)   AS total_revenue,
      SUM(s.discount)       AS total_discount,
      SUM(si.profit)        AS total_profit,
      SUM(CASE WHEN s.payment_type='cash' THEN 1 ELSE 0 END) AS cash_sales,
      SUM(CASE WHEN s.payment_type='loan' THEN 1 ELSE 0 END) AS loan_sales
    FROM sales s
    LEFT JOIN sale_items si ON si.sale_id = s.id
    WHERE DATE(s.created_at) BETWEEN ? AND ?
      ${NO_APPROVED_RETURNS}
    GROUP BY DATE(s.created_at) ORDER BY sale_date ASC`, [from, to]);

  const totals = rows.reduce((a, r) => ({
    total_sales:    a.total_sales    + Number(r.total_sales),
    total_revenue:  a.total_revenue  + Number(r.total_revenue  || 0),
    total_discount: a.total_discount + Number(r.total_discount || 0),
    total_profit:   a.total_profit   + Number(r.total_profit   || 0),
  }), { total_sales: 0, total_revenue: 0, total_discount: 0, total_profit: 0 });

  res.json({ from, to, rows, totals });
});

// 2. Sales Detail — excludes approved returns
router.get("/sales-detail", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const [rows] = await db.execute(`
    SELECT s.id AS sale_id, s.invoice_no, DATE(s.created_at) AS sale_date,
      c.name AS customer_name, c.phone, s.payment_type,
      s.total_amount, s.discount AS order_discount, s.paid_amount,
      (s.total_amount - s.paid_amount) AS balance_due,
      SUM(si.profit) AS total_profit, COUNT(si.id) AS item_count
    FROM sales s
    LEFT JOIN customers c ON c.customer_id = s.customer_id
    LEFT JOIN sale_items si ON si.sale_id = s.id
    WHERE DATE(s.created_at) BETWEEN ? AND ?
      ${NO_APPROVED_RETURNS}
    GROUP BY s.id ORDER BY s.created_at DESC`, [from, to]);
  res.json({ from, to, rows });
});

// 3. Product Sales — excludes approved returns
router.get("/product-sales", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const [rows] = await db.execute(`
    SELECT si.product_id, si.product_name,
      SUM(si.quantity)   AS total_qty,
      AVG(si.sale_price) AS avg_sale_price,
      AVG(si.cost_price) AS avg_cost_price,
      SUM(si.subtotal)   AS total_revenue,
      SUM(si.profit)     AS total_profit,
      SUM(si.item_discount * si.quantity) AS total_item_discount
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE DATE(s.created_at) BETWEEN ? AND ?
      ${NO_APPROVED_RETURNS}
    GROUP BY si.product_id, si.product_name
    ORDER BY total_revenue DESC`, [from, to]);
  res.json({ from, to, rows });
});

// 4. Profit & Loss — excludes approved returns
router.get("/profit-loss", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const [rows] = await db.execute(`
    SELECT DATE(s.created_at) AS report_date,
      SUM(si.quantity * si.cost_price) AS total_cogs,
      SUM(si.subtotal)   AS total_revenue,
      SUM(si.profit)     AS gross_profit,
      SUM(s.discount)    AS order_discounts,
      SUM(si.item_discount * si.quantity) AS item_discounts,
      SUM(si.profit) - SUM(s.discount)    AS net_profit
    FROM sales s
    LEFT JOIN sale_items si ON si.sale_id = s.id
    WHERE DATE(s.created_at) BETWEEN ? AND ?
      ${NO_APPROVED_RETURNS}
    GROUP BY DATE(s.created_at) ORDER BY report_date ASC`, [from, to]);
  res.json({ from, to, rows });
});

// 5. Customers — excludes approved returns from purchase totals
router.get("/customers", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const [rows] = await db.execute(`
    SELECT c.customer_id, c.name, c.phone, c.address, c.balance AS outstanding_balance,
      COUNT(DISTINCT s.id)              AS total_orders,
      COALESCE(SUM(s.total_amount), 0)  AS total_purchased,
      COALESCE(SUM(s.paid_amount),  0)  AS total_paid,
      MAX(s.created_at)                 AS last_purchase
    FROM customers c
    LEFT JOIN sales s ON s.customer_id = c.customer_id
      AND DATE(s.created_at) BETWEEN ? AND ?
      AND s.id NOT IN (
        SELECT r.sale_id FROM returns r WHERE r.status = 'approved'
      )
    GROUP BY c.customer_id ORDER BY outstanding_balance DESC`, [from, to]);
  res.json({ from, to, rows });
});

// 6. Loans — no change needed (loans are financial records, not revenue)
router.get("/loans", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const [rows] = await db.execute(`
    SELECT l.id AS loan_id, s.invoice_no, DATE(l.created_at) AS loan_date,
      c.name AS customer_name, c.phone,
      l.total_amount, l.paid_amount,
      (l.total_amount - l.paid_amount) AS remaining
    FROM loans l
    JOIN sales s ON s.id = l.sale_id
    JOIN customers c ON c.customer_id = l.customer_id
    WHERE DATE(l.created_at) BETWEEN ? AND ?
    ORDER BY remaining DESC`, [from, to]);
  const totalDue = rows.reduce((s, r) => s + Number(r.remaining || 0), 0);
  res.json({ from, to, rows, totalDue });
});

// 7. Suppliers — no change (supplier-side data)
router.get("/suppliers", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const [rows] = await db.execute(`
    SELECT sup.id, sup.name, sup.phone, sup.balance AS outstanding_balance,
      COUNT(DISTINCT so.id) AS total_orders,
      COALESCE(SUM(so.total_amount),0) AS total_ordered,
      COALESCE(SUM(CASE WHEN so.status='received' THEN so.total_amount ELSE 0 END),0) AS total_received
    FROM suppliers sup
    LEFT JOIN supplier_orders so ON so.supplier_id = sup.id
      AND DATE(so.created_at) BETWEEN ? AND ?
    GROUP BY sup.id ORDER BY outstanding_balance DESC`, [from, to]);
  res.json({ from, to, rows });
});

// 8. Supplier Orders — no change
router.get("/supplier-orders", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const [rows] = await db.execute(`
    SELECT so.id AS order_id, so.supplier_name, DATE(so.created_at) AS order_date,
      so.status, so.total_amount,
      COUNT(soi.id) AS item_count,
      SUM(soi.received_qty) AS total_received_qty
    FROM supplier_orders so
    LEFT JOIN supplier_order_items soi ON soi.order_id = so.id
    WHERE DATE(so.created_at) BETWEEN ? AND ?
    GROUP BY so.id ORDER BY so.created_at DESC`, [from, to]);
  res.json({ from, to, rows });
});

// 9. Inventory — no date filter, no change
router.get("/inventory", async (req, res) => {
  const [rows] = await db.execute(`
    SELECT p.Product_Id, p.Product_Name, p.Product_Price AS cost_price,
      ap.selling_Price AS retail_price, ap.Wholesale_Price AS wholesale_price,
      ap.Quantity AS stock_qty,
      (ap.Quantity * p.Product_Price)  AS stock_value_cost,
      (ap.Quantity * ap.selling_Price) AS stock_value_retail
    FROM available_products ap
    JOIN products p ON p.Product_Id = ap.product_id
    ORDER BY ap.Quantity ASC`);
  const totalCostValue   = rows.reduce((s, r) => s + Number(r.stock_value_cost   || 0), 0);
  const totalRetailValue = rows.reduce((s, r) => s + Number(r.stock_value_retail || 0), 0);
  res.json({ rows, totalCostValue, totalRetailValue });
});

// 10. Supplier Ledger — no change
router.get("/supplier-ledger", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const supplierId = req.query.supplier_id || null;
  let sql = `
    SELECT sl.id, sl.type, sl.debit, sl.credit, sl.balance,
      DATE(sl.created_at) AS entry_date, sup.name AS supplier_name
    FROM supplier_ledger sl
    JOIN suppliers sup ON sup.id = sl.supplier_id
    WHERE DATE(sl.created_at) BETWEEN ? AND ?`;
  const params = [from, to];
  if (supplierId) { sql += " AND sl.supplier_id = ?"; params.push(supplierId); }
  sql += " ORDER BY sl.created_at ASC";
  const [rows] = await db.execute(sql, params);
  res.json({ from, to, rows });
});

// ══════════════════════════════════════════════════════════════════════════════
// PRINT ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// P1. Sales Summary Print
router.get("/print/sales-summary", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const [rows] = await db.execute(`
    SELECT DATE(s.created_at) AS sale_date,
      COUNT(DISTINCT s.id) AS total_sales, SUM(s.total_amount) AS total_revenue,
      SUM(s.discount) AS total_discount, SUM(si.profit) AS total_profit,
      SUM(CASE WHEN s.payment_type='cash' THEN 1 ELSE 0 END) AS cash_sales,
      SUM(CASE WHEN s.payment_type='loan' THEN 1 ELSE 0 END) AS loan_sales
    FROM sales s LEFT JOIN sale_items si ON si.sale_id = s.id
    WHERE DATE(s.created_at) BETWEEN ? AND ?
      ${NO_APPROVED_RETURNS}
    GROUP BY DATE(s.created_at) ORDER BY sale_date ASC`, [from, to]);

  const tot = rows.reduce((a, r) => ({
    sales: a.sales + Number(r.total_sales),
    rev:   a.rev   + Number(r.total_revenue  || 0),
    disc:  a.disc  + Number(r.total_discount || 0),
    prof:  a.prof  + Number(r.total_profit   || 0),
  }), { sales: 0, rev: 0, disc: 0, prof: 0 });

  const cards = summaryCards([
    { label: "Total Transactions", value: tot.sales },
    { label: "Total Revenue",      value: rs(tot.rev) },
    { label: "Total Discounts",    value: rs(tot.disc) },
    { label: "Net Profit",         value: rs(tot.prof) },
  ], 4);

  const thead = tableHead([
    {label:"Date"},{label:"Sales",right:true},{label:"Cash",right:true},
    {label:"Loan",right:true},{label:"Revenue",right:true},
    {label:"Discount",right:true},{label:"Profit",right:true},
  ]);
  const tbody = rows.map(r => {
    const prof = Number(r.total_profit || 0);
    return `<tr>
      <td>${fmtDate(r.sale_date)}</td>
      <td class="tr">${r.total_sales}</td>
      <td class="tr">${r.cash_sales}</td>
      <td class="tr">${r.loan_sales}</td>
      <td class="tr">${rs(r.total_revenue)}</td>
      <td class="tr">${rs(r.total_discount)}</td>
      <td class="tr ${prof>=0?"profit":"loss"}">${rs(prof)}</td>
    </tr>`;
  }).join("");
  const tfoot = `<tfoot><tr class="tfoot">
    <td><b>TOTALS</b></td><td class="tr">${tot.sales}</td><td></td><td></td>
    <td class="tr">${rs(tot.rev)}</td><td class="tr">${rs(tot.disc)}</td>
    <td class="tr ${tot.prof>=0?"profit":"loss"}">${rs(tot.prof)}</td>
  </tr></tfoot>`;

  res.send(buildPrintPage({
    title: "Sales Summary Report",
    period: `${fmtDate(from)} to ${fmtDate(to)}`,
    summaryCardsHTML: cards,
    noteHTML: `<div class="note">ℹ Sales with approved returns are excluded from this report.</div>`,
    tableHTML: `<table>${thead}<tbody>${tbody}</tbody>${tfoot}</table>`,
  }));
});

// P2. Sales Detail Print
router.get("/print/sales-detail", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const [rows] = await db.execute(`
    SELECT s.id AS sale_id, s.invoice_no, DATE(s.created_at) AS sale_date,
      c.name AS customer_name, c.phone, s.payment_type,
      s.total_amount, s.paid_amount,
      (s.total_amount - s.paid_amount) AS balance_due,
      SUM(si.profit) AS total_profit, COUNT(si.id) AS item_count
    FROM sales s LEFT JOIN customers c ON c.customer_id = s.customer_id
    LEFT JOIN sale_items si ON si.sale_id = s.id
    WHERE DATE(s.created_at) BETWEEN ? AND ?
      ${NO_APPROVED_RETURNS}
    GROUP BY s.id ORDER BY s.created_at DESC`, [from, to]);

  const thead = tableHead([
    {label:"#"},{label:"Invoice"},{label:"Date"},{label:"Customer"},
    {label:"Phone"},{label:"Payment"},{label:"Amount",right:true},
    {label:"Paid",right:true},{label:"Balance",right:true},{label:"Profit",right:true},
  ]);
  const tbody = rows.map(r => {
    const bal  = Number(r.balance_due  || 0);
    const prof = Number(r.total_profit || 0);
    const ptBadge = r.payment_type === "cash"
      ? `<span class="badge bg-green">Cash</span>`
      : `<span class="badge bg-amber">Loan</span>`;
    return `<tr>
      <td>${r.sale_id}</td>
      <td style="font-family:monospace;font-size:8.5pt">${r.invoice_no || "—"}</td>
      <td>${fmtDate(r.sale_date)}</td>
      <td><b>${r.customer_name || "Walk-in"}</b></td>
      <td>${r.phone || "—"}</td>
      <td>${ptBadge}</td>
      <td class="tr">${rs(r.total_amount)}</td>
      <td class="tr">${rs(r.paid_amount)}</td>
      <td class="tr ${bal>0?"loss":""}">${rs(bal)}</td>
      <td class="tr ${prof>=0?"profit":"loss"}">${rs(prof)}</td>
    </tr>`;
  }).join("");

  res.send(buildPrintPage({
    title: "Detailed Sales Report",
    period: `${fmtDate(from)} to ${fmtDate(to)}`,
    noteHTML: `<div class="note">ℹ Sales with approved returns are excluded from this report.</div>`,
    tableHTML: `<table>${thead}<tbody>${tbody}</tbody></table>`,
  }));
});

// P3. Product Sales Print
router.get("/print/product-sales", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const [rows] = await db.execute(`
    SELECT si.product_name, SUM(si.quantity) AS total_qty,
      AVG(si.sale_price) AS avg_sale_price, AVG(si.cost_price) AS avg_cost_price,
      SUM(si.subtotal) AS total_revenue, SUM(si.profit) AS total_profit
    FROM sale_items si JOIN sales s ON s.id = si.sale_id
    WHERE DATE(s.created_at) BETWEEN ? AND ?
      ${NO_APPROVED_RETURNS}
    GROUP BY si.product_id, si.product_name ORDER BY total_revenue DESC`, [from, to]);

  const totRev  = rows.reduce((s,r)=>s+Number(r.total_revenue||0),0);
  const totProf = rows.reduce((s,r)=>s+Number(r.total_profit||0),0);
  const totQty  = rows.reduce((s,r)=>s+Number(r.total_qty||0),0);

  const cards = summaryCards([
    { label: "Products Sold", value: rows.length },
    { label: "Units Sold",    value: totQty },
    { label: "Revenue",       value: rs(totRev) },
    { label: "Profit",        value: rs(totProf) },
  ], 4);

  const thead = tableHead([
    {label:"Product"},{label:"Qty",right:true},{label:"Avg Cost",right:true},
    {label:"Avg Price",right:true},{label:"Revenue",right:true},{label:"Profit",right:true},
  ]);
  const tbody = rows.map(r => {
    const prof = Number(r.total_profit||0);
    return `<tr>
      <td><b>${r.product_name}</b></td>
      <td class="tr">${r.total_qty}</td>
      <td class="tr">${rs(r.avg_cost_price)}</td>
      <td class="tr">${rs(r.avg_sale_price)}</td>
      <td class="tr">${rs(r.total_revenue)}</td>
      <td class="tr ${prof>=0?"profit":"loss"}">${rs(prof)}</td>
    </tr>`;
  }).join("");

  res.send(buildPrintPage({
    title: "Product Sales Report",
    period: `${fmtDate(from)} to ${fmtDate(to)}`,
    summaryCardsHTML: cards,
    noteHTML: `<div class="note">ℹ Sales with approved returns are excluded from this report.</div>`,
    tableHTML: `<table>${thead}<tbody>${tbody}</tbody></table>`,
  }));
});

// P4. Profit & Loss Print
router.get("/print/profit-loss", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const [rows] = await db.execute(`
    SELECT DATE(s.created_at) AS report_date,
      SUM(si.quantity * si.cost_price) AS total_cogs,
      SUM(si.subtotal) AS total_revenue, SUM(si.profit) AS gross_profit,
      SUM(s.discount) AS order_discounts,
      SUM(si.item_discount * si.quantity) AS item_discounts,
      SUM(si.profit) - SUM(s.discount) AS net_profit
    FROM sales s LEFT JOIN sale_items si ON si.sale_id = s.id
    WHERE DATE(s.created_at) BETWEEN ? AND ?
      ${NO_APPROVED_RETURNS}
    GROUP BY DATE(s.created_at) ORDER BY report_date ASC`, [from, to]);

  const totRev   = rows.reduce((s,r)=>s+Number(r.total_revenue||0),0);
  const totCogs  = rows.reduce((s,r)=>s+Number(r.total_cogs||0),0);
  const totGross = rows.reduce((s,r)=>s+Number(r.gross_profit||0),0);
  const totNet   = rows.reduce((s,r)=>s+Number(r.net_profit||0),0);

  const cards = summaryCards([
    { label: "Revenue",      value: rs(totRev) },
    { label: "COGS",         value: rs(totCogs) },
    { label: "Gross Profit", value: rs(totGross) },
    { label: "Net Profit",   value: rs(totNet) },
  ], 4);

  const thead = tableHead([
    {label:"Date"},{label:"Revenue",right:true},{label:"COGS",right:true},
    {label:"Gross Profit",right:true},{label:"Discounts",right:true},{label:"Net Profit",right:true},
  ]);
  const tbody = rows.map(r => {
    const net = Number(r.net_profit||0);
    return `<tr>
      <td>${fmtDate(r.report_date)}</td>
      <td class="tr">${rs(r.total_revenue)}</td>
      <td class="tr">${rs(r.total_cogs)}</td>
      <td class="tr profit">${rs(r.gross_profit)}</td>
      <td class="tr">${rs(Number(r.order_discounts||0)+Number(r.item_discounts||0))}</td>
      <td class="tr ${net>=0?"profit":"loss"}">${rs(net)}</td>
    </tr>`;
  }).join("");

  res.send(buildPrintPage({
    title: "Profit & Loss Report",
    period: `${fmtDate(from)} to ${fmtDate(to)}`,
    summaryCardsHTML: cards,
    noteHTML: `<div class="note">ℹ Sales with approved returns are excluded from this report.</div>`,
    tableHTML: `<table>${thead}<tbody>${tbody}</tbody></table>`,
  }));
});

// P5. Customers Print
router.get("/print/customers", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const [rows] = await db.execute(`
    SELECT c.customer_id, c.name, c.phone, c.balance AS outstanding_balance,
      COUNT(DISTINCT s.id) AS total_orders,
      COALESCE(SUM(s.total_amount),0) AS total_purchased,
      COALESCE(SUM(s.paid_amount),0) AS total_paid,
      MAX(s.created_at) AS last_purchase
    FROM customers c
    LEFT JOIN sales s ON s.customer_id = c.customer_id
      AND DATE(s.created_at) BETWEEN ? AND ?
      AND s.id NOT IN (
        SELECT r.sale_id FROM returns r WHERE r.status = 'approved'
      )
    GROUP BY c.customer_id ORDER BY outstanding_balance DESC`, [from, to]);

  const thead = tableHead([
    {label:"Customer"},{label:"Phone"},{label:"Orders",right:true},
    {label:"Purchased",right:true},{label:"Paid",right:true},
    {label:"Outstanding",right:true},{label:"Last Purchase"},
  ]);
  const tbody = rows.map(r => {
    const bal = Number(r.outstanding_balance||0);
    return `<tr>
      <td><b>${r.name||"—"}</b></td><td>${r.phone||"—"}</td>
      <td class="tr">${r.total_orders}</td>
      <td class="tr">${rs(r.total_purchased)}</td>
      <td class="tr">${rs(r.total_paid)}</td>
      <td class="tr ${bal>0?"loss":""}">${rs(bal)}</td>
      <td>${fmtDate(r.last_purchase)}</td>
    </tr>`;
  }).join("");

  res.send(buildPrintPage({
    title: "Customer Report",
    period: `${fmtDate(from)} to ${fmtDate(to)}`,
    tableHTML: `<table>${thead}<tbody>${tbody}</tbody></table>`,
  }));
});

// P6. Loans Print
router.get("/print/loans", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const [rows] = await db.execute(`
    SELECT l.id AS loan_id, s.invoice_no, DATE(l.created_at) AS loan_date,
      c.name AS customer_name, c.phone,
      l.total_amount, l.paid_amount,
      (l.total_amount - l.paid_amount) AS remaining
    FROM loans l JOIN sales s ON s.id = l.sale_id
    JOIN customers c ON c.customer_id = l.customer_id
    WHERE DATE(l.created_at) BETWEEN ? AND ?
    ORDER BY remaining DESC`, [from, to]);

  const totalDue = rows.reduce((s,r)=>s+Number(r.remaining||0),0);
  const cards = summaryCards([
    { label: "Active Loans", value: rows.length },
    { label: "Total Due",    value: rs(totalDue) },
  ], 2);

  const thead = tableHead([
    {label:"Invoice"},{label:"Date"},{label:"Customer"},{label:"Phone"},
    {label:"Total",right:true},{label:"Paid",right:true},{label:"Remaining",right:true},
  ]);
  const tbody = rows.map(r => `<tr>
    <td style="font-family:monospace;font-size:8.5pt">${r.invoice_no||"—"}</td>
    <td>${fmtDate(r.loan_date)}</td>
    <td><b>${r.customer_name}</b></td><td>${r.phone||"—"}</td>
    <td class="tr">${rs(r.total_amount)}</td>
    <td class="tr">${rs(r.paid_amount)}</td>
    <td class="tr loss">${rs(r.remaining)}</td>
  </tr>`).join("");
  const tfoot = `<tfoot><tr class="tfoot"><td colspan="6"><b>TOTAL DUE</b></td>
    <td class="tr loss">${rs(totalDue)}</td></tr></tfoot>`;

  res.send(buildPrintPage({
    title: "Loan & Credit Report",
    period: `${fmtDate(from)} to ${fmtDate(to)}`,
    summaryCardsHTML: cards,
    tableHTML: `<table>${thead}<tbody>${tbody}</tbody>${tfoot}</table>`,
  }));
});

// P7. Suppliers Print
router.get("/print/suppliers", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const [rows] = await db.execute(`
    SELECT sup.id, sup.name, sup.phone, sup.balance AS outstanding_balance,
      COUNT(DISTINCT so.id) AS total_orders,
      COALESCE(SUM(so.total_amount),0) AS total_ordered,
      COALESCE(SUM(CASE WHEN so.status='received' THEN so.total_amount ELSE 0 END),0) AS total_received
    FROM suppliers sup
    LEFT JOIN supplier_orders so ON so.supplier_id = sup.id
      AND DATE(so.created_at) BETWEEN ? AND ?
    GROUP BY sup.id ORDER BY outstanding_balance DESC`, [from, to]);

  const thead = tableHead([
    {label:"Supplier"},{label:"Phone"},{label:"Orders",right:true},
    {label:"Ordered",right:true},{label:"Received",right:true},{label:"Balance",right:true},
  ]);
  const tbody = rows.map(r => {
    const bal = Number(r.outstanding_balance||0);
    return `<tr>
      <td><b>${r.name}</b></td><td>${r.phone||"—"}</td>
      <td class="tr">${r.total_orders}</td>
      <td class="tr">${rs(r.total_ordered)}</td>
      <td class="tr">${rs(r.total_received)}</td>
      <td class="tr ${bal>0?"loss":""}">${rs(bal)}</td>
    </tr>`;
  }).join("");

  res.send(buildPrintPage({
    title: "Supplier Report",
    period: `${fmtDate(from)} to ${fmtDate(to)}`,
    tableHTML: `<table>${thead}<tbody>${tbody}</tbody></table>`,
  }));
});

// P8. Supplier Orders Print
router.get("/print/supplier-orders", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const [rows] = await db.execute(`
    SELECT so.id AS order_id, so.supplier_name, DATE(so.created_at) AS order_date,
      so.status, so.total_amount, COUNT(soi.id) AS item_count
    FROM supplier_orders so
    LEFT JOIN supplier_order_items soi ON soi.order_id = so.id
    WHERE DATE(so.created_at) BETWEEN ? AND ?
    GROUP BY so.id ORDER BY so.created_at DESC`, [from, to]);

  const statusBadge = (s) => {
    const map = { received:"bg-green", partial:"bg-amber", ordered:"bg-blue", cancelled:"bg-red" };
    return `<span class="badge ${map[s]||"bg-gray"}">${s}</span>`;
  };
  const thead = tableHead([
    {label:"#"},{label:"Supplier"},{label:"Date"},{label:"Status"},
    {label:"Items",right:true},{label:"Amount",right:true},
  ]);
  const tbody = rows.map(r => `<tr>
    <td>${r.order_id}</td><td><b>${r.supplier_name}</b></td>
    <td>${fmtDate(r.order_date)}</td><td>${statusBadge(r.status)}</td>
    <td class="tr">${r.item_count}</td><td class="tr">${rs(r.total_amount)}</td>
  </tr>`).join("");

  res.send(buildPrintPage({
    title: "Supplier Orders Report",
    period: `${fmtDate(from)} to ${fmtDate(to)}`,
    tableHTML: `<table>${thead}<tbody>${tbody}</tbody></table>`,
  }));
});

// P9. Inventory Print
router.get("/print/inventory", async (req, res) => {
  const [rows] = await db.execute(`
    SELECT p.Product_Name, p.Product_Price AS cost_price,
      ap.selling_Price AS retail_price, ap.Wholesale_Price AS wholesale_price,
      ap.Quantity AS stock_qty,
      (ap.Quantity * p.Product_Price) AS stock_value_cost,
      (ap.Quantity * ap.selling_Price) AS stock_value_retail
    FROM available_products ap
    JOIN products p ON p.Product_Id = ap.product_id
    ORDER BY ap.Quantity ASC`);

  const totCost   = rows.reduce((s,r)=>s+Number(r.stock_value_cost||0),0);
  const totRetail = rows.reduce((s,r)=>s+Number(r.stock_value_retail||0),0);

  const cards = summaryCards([
    { label: "Products",     value: rows.length },
    { label: "Cost Value",   value: rs(totCost) },
    { label: "Retail Value", value: rs(totRetail) },
  ], 3);

  const thead = tableHead([
    {label:"Product"},{label:"Stock",right:true},{label:"Cost Price",right:true},
    {label:"Retail",right:true},{label:"Wholesale",right:true},{label:"Stock Value",right:true},
  ]);
  const tbody = rows.map(r => {
    const low = Number(r.stock_qty) <= 5;
    return `<tr>
      <td><b>${r.Product_Name}</b></td>
      <td class="tr ${low?"warn":""}">${r.stock_qty}${low?" ⚠":""}</td>
      <td class="tr">${rs(r.cost_price)}</td>
      <td class="tr">${rs(r.retail_price)}</td>
      <td class="tr">${rs(r.wholesale_price)}</td>
      <td class="tr">${rs(r.stock_value_cost)}</td>
    </tr>`;
  }).join("");

  res.send(buildPrintPage({
    title: "Inventory & Stock Report",
    period: `As of ${fmtDate(new Date())}`,
    summaryCardsHTML: cards,
    noteHTML: `<div class="note">⚠ Items marked in orange have stock ≤ 5 units — consider restocking immediately.</div>`,
    tableHTML: `<table>${thead}<tbody>${tbody}</tbody></table>`,
  }));
});

// P10. Supplier Ledger Print
router.get("/print/supplier-ledger", async (req, res) => {
  const { from, to } = dateBounds(req.query);
  const [rows] = await db.execute(`
    SELECT sl.id, sl.type, sl.debit, sl.credit, sl.balance,
      DATE(sl.created_at) AS entry_date, sup.name AS supplier_name
    FROM supplier_ledger sl JOIN suppliers sup ON sup.id = sl.supplier_id
    WHERE DATE(sl.created_at) BETWEEN ? AND ?
    ORDER BY sl.created_at ASC`, [from, to]);

  const thead = tableHead([
    {label:"#"},{label:"Date"},{label:"Supplier"},{label:"Type"},
    {label:"Debit",right:true},{label:"Credit",right:true},{label:"Balance",right:true},
  ]);
  const tbody = rows.map(r => `<tr>
    <td>${r.id}</td><td>${fmtDate(r.entry_date)}</td>
    <td><b>${r.supplier_name}</b></td>
    <td><span class="badge bg-blue">${r.type}</span></td>
    <td class="tr ${Number(r.debit)>0?"loss":""}">${rs(r.debit)}</td>
    <td class="tr ${Number(r.credit)>0?"profit":""}">${rs(r.credit)}</td>
    <td class="tr">${rs(r.balance)}</td>
  </tr>`).join("");

  res.send(buildPrintPage({
    title: "Supplier Ledger",
    period: `${fmtDate(from)} to ${fmtDate(to)}`,
    tableHTML: `<table>${thead}<tbody>${tbody}</tbody></table>`,
  }));
});

export default router;
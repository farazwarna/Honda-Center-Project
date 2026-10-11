// ─── printInvoice.js ──────────────────────────────────────────────────────────
// Compatible with POS.jsx — uses: items, subtotal, itemDiscountTotal,
// discount, total, cash, change, paymentType, customerType,
// customerName, customerPhone, customerAddress, invoiceNo, saleId, date

export const printA4 = (data) => {
  const {
    items = [],
    subtotal = 0,
    itemDiscountTotal = 0,
    discount = 0,
    total = 0,
    cash = 0,
    change = 0,
    paymentType = "cash",
    customerType = "retail",
    customerName = "",
    customerPhone = "",
    customerAddress = "",
    invoiceNo = "",
    saleId = "",
    date = new Date(),
  } = data;

  const formattedDate = new Date(date).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const invoice = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice — Fawad Honda Center</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --red:    #c8102e;
      --red-dk: #9b0c22;
      --gold:   #c9a84c;
      --ink:    #1a1a2e;
      --muted:  #6b7280;
      --line:   #e5e7eb;
      --bg:     #fafafa;
    }

    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--bg);
      color: var(--ink);
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      font-size: 13px;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 3px solid var(--red);
      margin-bottom: 28px;
    }

    .brand-block {}
    .brand-name {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 900;
      color: var(--red);
      letter-spacing: -0.5px;
      line-height: 1;
    }
    .brand-sub {
      font-size: 11px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 4px;
    }
    .brand-accent {
      width: 40px;
      height: 3px;
      background: var(--gold);
      margin-top: 8px;
    }

    .invoice-meta {
      text-align: right;
    }
    .invoice-title {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 700;
      color: var(--ink);
    }
    .invoice-detail {
      color: var(--muted);
      font-size: 12px;
      margin-top: 6px;
      line-height: 1.8;
    }
    .invoice-detail strong { color: var(--ink); }
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 6px;
    }
    .badge-retail  { background: #dbeafe; color: #1d4ed8; }
    .badge-wholesale { background: #d1fae5; color: #065f46; }
    .badge-cash    { background: #d1fae5; color: #065f46; }
    .badge-loan    { background: #fef3c7; color: #92400e; }

    /* ── Customer row ── */
    .customer-bar {
      display: flex;
      gap: 32px;
      background: #f3f4f6;
      border-left: 4px solid var(--red);
      padding: 14px 18px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 28px;
      font-size: 12.5px;
    }
    .customer-bar .field { display: flex; flex-direction: column; gap: 2px; }
    .customer-bar .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); }
    .customer-bar .value { font-weight: 600; color: var(--ink); }

    /* ── Table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    thead tr {
      background: var(--ink);
      color: #fff;
    }
    thead th {
      padding: 11px 14px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    thead th:first-child { border-radius: 6px 0 0 6px; }
    thead th:last-child  { border-radius: 0 6px 6px 0; text-align: right; }
    thead th.r { text-align: right; }

    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody tr:hover { background: #f0f4ff; }
    tbody td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--line);
      font-size: 13px;
    }
    tbody td.r { text-align: right; }
    .product-name { font-weight: 600; color: var(--ink); }
    .product-price-note { font-size: 11px; color: var(--muted); margin-top: 2px; }
    .disc-cell { color: #d97706; font-weight: 600; }

    /* ── Summary ── */
    .summary-wrap {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    .summary {
      width: 280px;
      border: 1px solid var(--line);
      border-radius: 10px;
      overflow: hidden;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 16px;
      font-size: 13px;
      border-bottom: 1px solid var(--line);
    }
    .summary-row:last-child { border-bottom: none; }
    .summary-row .lbl { color: var(--muted); }
    .summary-row .val { font-weight: 600; }
    .summary-row.disc .val { color: #d97706; }
    .summary-row.total-row {
      background: var(--red);
      color: #fff;
    }
    .summary-row.total-row .lbl,
    .summary-row.total-row .val {
      color: #fff;
      font-size: 15px;
      font-weight: 700;
    }
    .summary-row.change-row .val { color: #16a34a; }

    /* ── Payment note ── */
    .payment-note {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 32px;
      font-size: 12px;
      color: #92400e;
    }

    /* ── Footer ── */
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px dashed #d1d5db;
      font-size: 12px;
      color: var(--muted);
      line-height: 2;
    }
    .footer .thank { font-size: 15px; font-weight: 700; color: var(--ink); letter-spacing: 0.5px; }
    .footer .dev {
      margin-top: 12px;
      font-size: 10px;
      color: #9ca3af;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .footer .dev span { color: var(--red); font-weight: 700; }

    @media print {
      body { padding: 20px; }
      @page { margin: 10mm; }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="brand-block">
      <div class="brand-name">Fawad Honda Center</div>
      <div class="brand-sub">Auto Parts &amp; Accessories</div>
      <div class="brand-accent"></div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">Sales Invoice</div>
      <div class="invoice-detail">
        ${invoiceNo ? `<strong>Invoice #</strong> ${invoiceNo}<br/>` : ""}
        ${saleId    ? `<strong>Sale ID #</strong> ${saleId}<br/>`    : ""}
        <strong>Date:</strong> ${formattedDate}
      </div>
      <span class="badge badge-${customerType}">${customerType}</span>
      &nbsp;
      <span class="badge badge-${paymentType}">${paymentType}</span>
    </div>
  </div>

  <!-- CUSTOMER INFO -->
  ${customerName || customerPhone || customerAddress ? `
  <div class="customer-bar">
    ${customerName    ? `<div class="field"><span class="label">Customer</span><span class="value">${customerName}</span></div>` : ""}
    ${customerPhone   ? `<div class="field"><span class="label">Phone</span><span class="value">${customerPhone}</span></div>`   : ""}
    ${customerAddress ? `<div class="field"><span class="label">Address</span><span class="value">${customerAddress}</span></div>` : ""}
  </div>` : ""}

  <!-- ITEMS TABLE -->
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Product</th>
        <th class="r">Qty</th>
        <th class="r">Unit Price</th>
        <th class="r">Item Disc</th>
        <th class="r">Line Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, idx) => {
        const disc      = item.item_discount || 0;
        const unitPrice = item.price || item.selling_Price || 0;
        const lineTotal = item.qty * (unitPrice - disc);
        return `
        <tr>
          <td>${idx + 1}</td>
          <td>
            <div class="product-name">${item.Product_Name}</div>
            ${disc > 0 ? `<div class="product-price-note">Disc applied: Rs ${disc}/unit</div>` : ""}
          </td>
          <td class="r">${item.qty}</td>
          <td class="r">Rs ${Number(unitPrice).toLocaleString()}</td>
          <td class="r disc-cell">${disc > 0 ? `− Rs ${disc}` : "—"}</td>
          <td class="r">Rs ${Number(lineTotal).toLocaleString()}</td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>

  <!-- SUMMARY -->
  <div class="summary-wrap">
    <div class="summary">
      <div class="summary-row">
        <span class="lbl">Subtotal</span>
        <span class="val">Rs ${Number(subtotal).toLocaleString()}</span>
      </div>
      <div class="summary-row disc">
        <span class="lbl">Item Discounts</span>
        <span class="val">− Rs ${Number(itemDiscountTotal).toLocaleString()}</span>
      </div>
      <div class="summary-row disc">
        <span class="lbl">Order Discount</span>
        <span class="val">− Rs ${Number(discount).toLocaleString()}</span>
      </div>
      <div class="summary-row total-row">
        <span class="lbl">Total Due</span>
        <span class="val">Rs ${Number(total).toLocaleString()}</span>
      </div>
      ${paymentType === "cash" ? `
      <div class="summary-row">
        <span class="lbl">Cash Paid</span>
        <span class="val">Rs ${Number(cash).toLocaleString()}</span>
      </div>
      <div class="summary-row change-row">
        <span class="lbl">Change</span>
        <span class="val">Rs ${Number(change).toLocaleString()}</span>
      </div>` : `
      <div class="summary-row">
        <span class="lbl">Payment</span>
        <span class="val" style="color:#d97706;">On Loan</span>
      </div>`}
    </div>
  </div>

  ${paymentType === "loan" ? `
  <div class="payment-note">
    ⚠️ <strong>Loan Sale</strong> — Amount of Rs ${Number(total).toLocaleString()} is due from ${customerName || "customer"}.
  </div>` : ""}

  <!-- FOOTER -->
  <div class="footer">
    <div class="thank">Thank you for your business! 🙏</div>
    <div>We appreciate your trust in Fawad Honda Center.</div>
    <div>For queries, please contact us with your invoice number.</div>
    <div class="dev">Developed by <span>Faraz Baloch</span></div>
  </div>

</body>
</html>`;

  const win = window.open("", "", "width=900,height=750");
  win.document.write(invoice);
  win.document.close();
  win.print();
};


// ─── Thermal Receipt ──────────────────────────────────────────────────────────
export const printThermal = (data) => {
  const {
    items = [],
    subtotal = 0,
    itemDiscountTotal = 0,
    discount = 0,
    total = 0,
    cash = 0,
    change = 0,
    paymentType = "cash",
    customerType = "retail",
    customerName = "",
    customerPhone = "",
    invoiceNo = "",
    saleId = "",
    date = new Date(),
  } = data;

  const formattedDate = new Date(date).toLocaleString("en-PK", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const receipt = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Fawad Honda Center</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Courier New', Courier, monospace;
      width: 300px;
      margin: 0 auto;
      padding: 14px 10px;
      font-size: 12px;
      color: #111;
      background: #fff;
    }

    .center { text-align: center; }
    .right  { text-align: right;  }
    .bold   { font-weight: bold;  }

    /* ── Shop Header ── */
    .shop-name {
      font-size: 17px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 2px;
      text-align: center;
      line-height: 1.2;
    }
    .shop-sub {
      text-align: center;
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #555;
      margin-top: 2px;
    }

    hr.solid { border: none; border-top: 1px solid #111; margin: 8px 0; }
    hr.dash  { border: none; border-top: 1px dashed #999; margin: 8px 0; }

    /* ── Row utility ── */
    .row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin: 3px 0;
    }
    .row .left  { flex: 1; }
    .row .right { text-align: right; white-space: nowrap; }

    /* ── Item block ── */
    .item-name { font-weight: 700; word-break: break-word; }
    .item-calc { font-size: 11px; color: #555; margin-left: 4px; }
    .item-disc { font-size: 11px; color: #c8102e; margin-left: 4px; }

    /* ── Totals ── */
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin: 3px 0;
    }
    .final-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      font-weight: 900;
      margin: 5px 0;
      padding: 4px 0;
      border-top: 1px solid #111;
      border-bottom: 1px solid #111;
    }
    .change-val { font-weight: 700; color: #16a34a; }
    .loan-note  { font-size: 11px; text-align: center; color: #c8102e; font-weight: 700; margin: 6px 0; }

    /* ── Footer ── */
    .footer { text-align: center; margin-top: 12px; font-size: 11px; color: #555; line-height: 1.9; }
    .footer .thank { font-size: 13px; font-weight: 700; color: #111; }
    .footer .dev {
      margin-top: 8px;
      font-size: 9px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #aaa;
      border-top: 1px dashed #ddd;
      padding-top: 6px;
    }
    .footer .dev span { color: #c8102e; font-weight: 900; }

    @media print {
      @page { margin: 0; size: 80mm auto; }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="shop-name">Fawad Honda<br/>Center</div>
  <div class="shop-sub">Auto Parts &amp; Accessories</div>
  <hr class="solid"/>

  <!-- META -->
  <div class="center" style="font-size:11px; color:#555; line-height:1.7;">
    ${invoiceNo ? `Inv # <strong>${invoiceNo}</strong><br/>` : ""}
    ${saleId    ? `Sale ID: <strong>${saleId}</strong><br/>`  : ""}
    ${formattedDate}
  </div>

  ${customerName || customerPhone ? `
  <hr class="dash"/>
  <div class="row"><span class="left bold">Customer</span><span class="right">${customerName || "—"}</span></div>
  ${customerPhone ? `<div class="row"><span class="left" style="color:#555;">Phone</span><span class="right">${customerPhone}</span></div>` : ""}
  <div class="row"><span class="left" style="color:#555;">Type</span><span class="right">${customerType.toUpperCase()}</span></div>` : ""}

  <hr class="solid"/>

  <!-- ITEMS -->
  ${items.map((item) => {
    const disc      = item.item_discount || 0;
    const unitPrice = item.price || item.selling_Price || 0;
    const lineTotal = item.qty * (unitPrice - disc);
    return `
    <div style="margin-bottom:6px;">
      <div class="item-name">${item.Product_Name}</div>
      <div class="row">
        <span class="item-calc">${item.qty} × Rs ${Number(unitPrice).toLocaleString()}${disc > 0 ? ` (− ${disc})` : ""}</span>
        <span class="right bold">Rs ${Number(lineTotal).toLocaleString()}</span>
      </div>
    </div>`;
  }).join("")}

  <hr class="solid"/>

  <!-- TOTALS -->
  <div class="total-row"><span>Subtotal</span><span>Rs ${Number(subtotal).toLocaleString()}</span></div>

  ${itemDiscountTotal > 0 ? `
  <div class="total-row" style="color:#c8102e;">
    <span>Item Discounts</span>
    <span>− Rs ${Number(itemDiscountTotal).toLocaleString()}</span>
  </div>` : ""}

  ${discount > 0 ? `
  <div class="total-row" style="color:#c8102e;">
    <span>Order Discount</span>
    <span>− Rs ${Number(discount).toLocaleString()}</span>
  </div>` : ""}

  <div class="final-row">
    <span>TOTAL DUE</span>
    <span>Rs ${Number(total).toLocaleString()}</span>
  </div>

  ${paymentType === "cash" ? `
  <div class="total-row"><span>Cash Paid</span><span>Rs ${Number(cash).toLocaleString()}</span></div>
  <div class="total-row"><span>Change</span><span class="change-val">Rs ${Number(change).toLocaleString()}</span></div>`
  : `<div class="loan-note">⚠ LOAN SALE — Amount Due: Rs ${Number(total).toLocaleString()}</div>`}

  <hr class="dash"/>

  <!-- FOOTER -->
  <div class="footer">
    <div class="thank">★ Thank You! ★</div>
    <div>Visit Again 🙏</div>
    <div>Keep this receipt for reference</div>
    <div class="dev">Developed by <span>Faraz Baloch</span></div>
  </div>

</body>
</html>`;

  const win = window.open("", "", "width=340,height=650");
  win.document.write(receipt);
  win.document.close();
  win.print();
};
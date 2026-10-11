export const printSaleItemsInvoice = (sale, items) => {
  const win = window.open("", "", "width=900,height=700");

  const rows = items
    .map(
      (i) => `
      <tr>
        <td>${i.Product_Name}</td>
        <td style="text-align:center">${i.quantity}</td>
        <td style="text-align:right">${i.price}</td>
        <td style="text-align:right">${i.quantity * i.price}</td>
      </tr>
    `
    )
    .join("");

  win.document.write(`
    <html>
      <head>
        <title>Invoice</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          h2 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background: #f3f3f3; }
          .info { margin-bottom: 10px; }
        </style>
      </head>

      <body>

        <h2>FAWAD HONDA CENTER</h2>

        <div class="info">
          <p><b>Customer:</b> ${sale.name}</p>
          <p><b>Total:</b> ${sale.total_amount}</p>
          <p><b>Paid:</b> ${sale.paid_amount}</p>
          <p><b>Payment Type:</b> ${sale.payment_type}</p>
          <p><b>Date:</b> ${new Date(sale.created_at).toLocaleString()}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>

        </table>

        <br/>

        <h3 style="text-align:right">
          Grand Total: ${sale.total_amount}
        </h3>

        <script>
          window.print();
        </script>

      </body>
    </html>
  `);

  win.document.close();
};
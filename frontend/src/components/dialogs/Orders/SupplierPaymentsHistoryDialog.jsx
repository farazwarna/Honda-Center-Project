import React, { useEffect, useState } from "react";
import axios from "axios";

const SupplierLedgerModal = ({ open, onClose, supplier }) => {
  const [data, setData] = useState([]);
const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");
  useEffect(() => {
    if (open && supplier) {
      load();
    }
  }, [open, supplier]);

  const load = async () => {
    const res = await axios.get(
      `http://localhost:8081/Supplier/supplier-ledger/${supplier.id}`
    );
    setData(res.data);
  };

  if (!open) return null;


const handleA4Print = () => {
  const content = document.getElementById("print-area").innerHTML;

  const win = window.open("", "", "width=1000,height=800");

  win.document.write(`
    <html>
      <head>
        <title>Supplier Statement</title>
        <style>
          body {
            font-family: Arial;
            padding: 30px;
          }

          h1 {
            text-align: center;
          }

          .header {
            margin-bottom: 20px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
          }

          th {
            background: #f2f2f2;
          }

          .footer {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>

        <h1>Supplier Statement</h1>

        <div class="header">
          <p><b>Supplier:</b> ${supplier.name}</p>
          <p><b>Date:</b> ${new Date().toLocaleDateString()}</p>
        </div>

        ${content}

        <div class="footer">
          <div>Prepared By</div>
          <div>Authorized Signature</div>
        </div>

      </body>
    </html>
  `);

  win.document.close();
  win.print();
};



const downloadPDF = async () => {
  const res = await axios.get(
    `http://localhost:8081/Supplier/statement-pdf/${supplier.id}?from=${fromDate}&to=${toDate}`,
    { responseType: "blob" }
  );

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");

  link.href = url;
  link.download = `Statement_${supplier.name}.pdf`;

  link.click();
};


  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

      <div className="bg-white w-[1000px] max-h-[80vh] overflow-y-auto rounded-xl p-5 shadow-xl">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">
            📊 {supplier.name} - Ledger
          </h2>
        

  <div className="flex gap-2">
    <div className="flex gap-2 mb-3">
  <input
    type="date"
    value={fromDate}
    onChange={(e) => setFromDate(e.target.value)}
    className="border p-2"
  />

  <input
    type="date"
    value={toDate}
    onChange={(e) => setToDate(e.target.value)}
    className="border p-2"
  />
</div>
    
    {/* 🖨️ PRINT BUTTON */}
   <button
    onClick={handleA4Print}
    className="bg-green-600 text-white px-3 py-1 rounded"
  >
    📄 A4 Print
  </button>
  <button
  onClick={downloadPDF}
  className="bg-red-600 text-white px-3 py-1 rounded"
>
  📥 Download PDF
</button>

    <button onClick={onClose}>❌</button>
  </div>


        </div>
        

        {/* TABLE */}
        <div id="print-area">
        <table className="w-full text-sm text-center">

          <thead className="bg-gray-200">
            <tr>
              <th className="">Date</th>
              <th>Type</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
            </tr>
          </thead>

          <tbody>
            {data.map((d, i) => (
              <tr key={i} className="border-b">

                <td className="p-2">
                  {new Date(d.created_at).toLocaleDateString()}
                </td>

                <td>
                  <span
                    className={`px-2 py-1 rounded text-white text-xs ${
                      d.type === "purchase"
                        ? "bg-blue-500"
                        : "bg-green-600"
                    }`}
                  >
                    {d.type}
                  </span>
                </td>

                <td className="text-red-600">
                  {d.debit || "-"}
                </td>

                <td className="text-green-600">
                  {d.credit || "-"}
                </td>

                <td className="font-bold">
                  {d.balance}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
</div>
      </div>

    </div>
  );
};

export default SupplierLedgerModal;
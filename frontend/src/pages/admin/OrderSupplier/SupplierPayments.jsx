import React, { useEffect, useState } from "react";
import axios from "axios";

const SupplierPayment = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");

  const load = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8081/Supplier/supplier-balances"
      );

      console.log("API DATA:", res.data); // 🔍 debug

      setSuppliers(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pay = async () => {
    await axios.post("http://localhost:8081/Supplier/pay", {
      supplier_name: selected.supplier_name,
      amount: Number(amount),
      payment_method: "cash",
      notes: "manual payment",
    });

    setSelected(null);
    setAmount("");
    load();
  };

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">
        Supplier Payments
      </h1>

      {/* DEBUG CHECK */}
      {suppliers.length === 0 && (
        <p className="text-red-500">
          No supplier balances found
        </p>
      )}

      <div className="bg-white shadow rounded-xl overflow-hidden">

        <table className="w-full">

          <thead className="bg-black text-white">
            <tr>
              <th className="p-3 text-left">Supplier</th>
              <th>Balance</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {suppliers.map((s, i) => (
              <tr key={i} className="border-b">

                <td className="p-3 font-semibold">
                  {s.supplier_name}
                </td>

                <td className="text-red-600 font-bold">
                  Rs {s.balance}
                </td>

                <td>
                  <button
                    onClick={() => setSelected(s)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Pay
                  </button>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white p-5 w-96 rounded-xl">

            <h2 className="font-bold mb-3">
              Pay {selected.supplier_name}
            </h2>

            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border p-2 w-full mb-3"
              placeholder="Enter amount"
            />

            <button
              onClick={pay}
              className="bg-green-600 text-white w-full py-2"
            >
              Pay
            </button>

            <button
              onClick={() => setSelected(null)}
              className="mt-2 bg-gray-400 text-white w-full py-2"
            >
              Cancel
            </button>

          </div>

        </div>
      )}

    </div>
  );
};

export default SupplierPayment;
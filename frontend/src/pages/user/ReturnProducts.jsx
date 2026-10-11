import { useState } from "react";
import axios from "axios";

const ReturnProducts = ({ sale, onClose }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const addItem = (product) => {
    setItems([
      ...items,
      {
        product_id: product.product_id,
        quantity: 1,
        condition_status: "good",
        refund_price: product.sale_price,
      },
    ]);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // 1. Create return
    await axios.post("http://localhost:8081/Return/create-return", {
  sale_id: sale.id,
  customer_id: sale.customer_id,
  items: items.map(it => ({
    product_id: it.product_id,
    quantity: Number(it.quantity),
    condition_status: it.condition_status,
    refund_price: Number(it.refund_price)
  })),
  notes: "Return from UI"
});

      const return_id = res.data.return_id;
      const totalRefund = res.data.totalRefund;

      // 2. Apply refund
      await axios.post("/api/apply-refund", {
        sale_id: sale.id,
        customer_id: sale.customer_id,
        refund_amount: totalRefund,
        payment_type: sale.payment_type,
        return_id,
      });

      alert("Return processed successfully");
      onClose();
    } catch (err) {
      console.log(err);
      alert("Return failed");
    }

    setLoading(false);
  };

  return (
    <div className="p-4 bg-white rounded shadow-lg">
      <h2 className="text-xl font-bold mb-3">Return Products</h2>

      {items.map((item, index) => (
        <div key={index} className="flex gap-2 mb-2">
          <span>{item.product_id}</span>

          <input
            type="number"
            value={item.quantity}
            onChange={(e) => {
              const newItems = [...items];
              newItems[index].quantity = e.target.value;
              setItems(newItems);
            }}
          />

          <select
            value={item.condition_status}
            onChange={(e) => {
              const newItems = [...items];
              newItems[index].condition_status = e.target.value;
              setItems(newItems);
            }}
          >
            <option value="good">Good</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-red-500 text-white px-4 py-2 mt-3"
      >
        {loading ? "Processing..." : "Process Return"}
      </button>
    </div>
  );
};

export default ReturnProducts;
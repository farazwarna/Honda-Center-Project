import express from "express";
import db from "../config/db.js";

const router = express.Router();

router.post("/createSupplierOrder", async (req, res) => {
  const { supplier_name, items } = req.body;

  try {
    // 1. create order
    const [orderResult] = await db.query(
      "INSERT INTO supplier_orders (supplier_name, total_amount) VALUES (?, ?)",
      [supplier_name, 0]
    );

    const orderId = orderResult.insertId;

    let total = 0;

    // 2. insert items
    for (let item of items) {
      total += item.price * item.quantity;

      await db.query(
        `INSERT INTO supplier_order_items 
        (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    // 3. update total
    await db.query(
      "UPDATE supplier_orders SET total_amount = ? WHERE id = ?",
      [total, orderId]
    );

    res.json({ success: true, orderId });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Order failed" });
  }
});

export default router;
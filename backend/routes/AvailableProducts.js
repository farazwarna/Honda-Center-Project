import express from "express";
import db from "../config/db.js";

const router = express.Router();


// ============================
// ❌ DELETE PRODUCT (SOFT STYLE HOOK READY)
// ============================
router.delete("/DeleteProduct/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const sql = "DELETE FROM available_products WHERE product_id = ?";

    const [result] = await db.query(sql, [id]);

    return res.json({
      message: "Product deleted successfully",
      result,
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
});


// ============================
// ♻️ RESTORE PRODUCT
// ============================
router.post("/RestoreDeletedProduct", async (req, res) => {
  try {
    const {
      product_id,
      productname,
      productkey,
      productprice,
      selling_Price,
      Wholesale_Price,
      Quantity,
    } = req.body;

    const sql = `
      INSERT INTO available_products 
      (product_id, selling_Price, Wholesale_Price, Quantity)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      product_id,
      selling_Price,
      Wholesale_Price,
      Quantity,
    ]);

    return res.json({
      message: "Restored successfully",
      result,
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
});


// ============================
// 📦 GET AVAILABLE PRODUCTS (PAGINATION + SEARCH)
// ============================
router.get("/getAvailableProducts", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const search = req.query.search || "";
    const searchValue = `%${search}%`;

    const sql = `
      SELECT ap.*, p.Product_Name, p.Product_Key ,p.Product_Price
      FROM available_products ap
      JOIN products p ON p.Product_Id = ap.product_id
      WHERE p.Product_Name LIKE ?
      ORDER BY ap.Ap_Id DESC
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM available_products ap
      JOIN products p ON p.Product_Id = ap.product_id
      WHERE p.Product_Name LIKE ?
    `;

    const [countResult] = await db.query(countSql, [searchValue]);
    const total = countResult[0].total;

    const [data] = await db.query(sql, [
      searchValue,
      limit,
      offset,
    ]);

    return res.json({
      data,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
});


// ============================
// 🔄 UPDATE STOCK PRICES
// ============================
router.put("/UpdateAvailableStocks", async (req, res) => {
  try {
    const {
      productretailprice,
      productwholesaleprice,
      product_id,
    } = req.body;

    const retail = Number(productretailprice);
    const wholesale = Number(productwholesaleprice);

    // validation
    if (wholesale > retail) {
      return res.status(400).json({
        error: "Wholesale price must be less than or equal to retail price",
      });
    }

    const sql = `
      UPDATE available_products
      SET selling_Price = ?, Wholesale_Price = ?
      WHERE product_id = ?
    `;

    const [result] = await db.query(sql, [
      retail,
      wholesale,
      product_id,
    ]);

    return res.json({
      message: "Updated successfully",
      result,
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
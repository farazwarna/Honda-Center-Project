import express from "express";
import db from "../config/db.js";

const router = express.Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Safely escape a string for use in dangerouslySetInnerHTML highlight on the
 * frontend. Not used here directly, but kept as a note — validation lives here.
 */
const requireFields = (fields, body) => {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === "");
  return missing.length ? missing : null;
};

// ============================
// 📦 ADD PRODUCT (PROCEDURE)
// ============================
router.post("/addProduct", async (req, res) => {
  const required = [
    "product_id", "productkey", "productname", "productmodel",
    "productprice", "productdesc1", "productunit",
    "productretailprice", "productwholesaleprice", "productminstock",
  ];

  const missing = requireFields(required, req.body);
  if (missing) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
  }

  try {
    // ✅ Pass values directly (not nested) — CALL expects 10 individual params
    const values = [
      req.body.product_id,
      req.body.productkey,
      req.body.productname,
      req.body.productmodel,
      req.body.productprice,
      req.body.productdesc1,
      req.body.productunit,
      req.body.productretailprice,
      req.body.productwholesaleprice,
      req.body.productminstock,
    ];

    await db.query("CALL RegisterNewProduct(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", values);

    return res.status(201).json({ message: "Product created successfully" });
  } catch (err) {
    console.error("[addProduct]", err);
    return res.status(500).json({ error: "Failed to create product" });
  }
});

// ============================
// ✏️ GET SINGLE PRODUCT
// ============================
router.get("/productEdit/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "SELECT * FROM products WHERE Product_Id = ?",
      [req.params.id]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(result[0]);
  } catch (err) {
    console.error("[productEdit]", err);
    return res.status(500).json({ error: "Failed to fetch product" });
  }
});

// ============================
// 🔄 UPDATE PRODUCT
// ============================
router.put("/updateProduct/:id", async (req, res) => {
  const required = ["productkey", "productname", "productprice", "productdesc1"];

  const missing = requireFields(required, req.body);
  if (missing) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
  }

  try {
    const sql = `
      UPDATE products
      SET
        Product_Key         = ?,
        Product_Name        = ?,
        Product_Price       = ?,
        Product_Description = ?
      WHERE Product_Id = ?
    `;

    const values = [
      req.body.productkey,
      req.body.productname,
      req.body.productprice,
      req.body.productdesc1,
      req.params.id,
    ];

    const [result] = await db.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ message: "Product updated successfully" });
  } catch (err) {
    console.error("[updateProduct]", err);
    return res.status(500).json({ error: "Failed to update product" });
  }
});

// ============================
// 📦 GET ALL PRODUCTS (PAGINATION)
// ============================
router.get("/getdata", async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const search = (req.query.search || "").trim();
    const offset = (page - 1) * limit;

    const searchValue = `%${search}%`;

    const [[data], [countResult]] = await Promise.all([
      db.query(
        `SELECT * FROM products
         WHERE Product_Name LIKE ? OR Product_Key LIKE ?
         ORDER BY Product_Id DESC
         LIMIT ? OFFSET ?`,
        [searchValue, searchValue, limit, offset]
      ),
      db.query(
        `SELECT COUNT(*) AS total FROM products
         WHERE Product_Name LIKE ? OR Product_Key LIKE ?`,
        [searchValue, searchValue]
      ),
    ]);

    const total = countResult[0].total;

    return res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[getdata]", err);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ============================
// ❌ DELETE PRODUCT
// ============================
router.delete("/delete/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM products WHERE Product_Id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("[deleteProduct]", err);
    return res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET the single admin (id, username, email - never password)
router.get("/get", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT admin_id, username, email FROM admin_table LIMIT 1"
    );
    if (results.length === 0)
      return res.status(404).json({ success: false, message: "No admin found." });

    res.json({ success: true, admin: results[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error.", error: err.message });
  }
});

// PUT update the single admin's password
router.put("/update-password", async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword)
    return res.status(400).json({ success: false, message: "All fields are required." });

  if (newPassword !== confirmPassword)
    return res.status(400).json({ success: false, message: "New passwords do not match." });

  if (newPassword.length < 6)
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });

  try {
    // Verify current password
    const [results] = await db.query(
      "SELECT admin_id FROM admin_table WHERE password = ? LIMIT 1",
      [currentPassword]
    );

    if (results.length === 0)
      return res.status(401).json({ success: false, message: "Current password is incorrect." });

    const adminId = results[0].admin_id;

    // Update password
    await db.query(
      "UPDATE admin_table SET password = ? WHERE admin_id = ?",
      [newPassword, adminId]
    );

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error.", error: err.message });
  }
});

export default router;
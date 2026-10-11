import express from 'express'
import db from '../config/db.js'

const router = express.Router()

router.post('/login', async (req, res) => {
  const { password } = req.body

  if (!password) {
    return res.status(400).json({ message: 'Password is required' })
  }

  try {
    const [rows] = await db.execute(
      "SELECT * FROM admin_table WHERE username = 'Admin' AND password = ?",
      [password]
    )

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    return res.json({ username: rows[0].username, message: 'Logged in' })

  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

export default router
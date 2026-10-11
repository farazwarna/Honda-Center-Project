import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const Login = () => {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:8081/auth/login', { password })

      if (res.data.username === 'Admin') {
        localStorage.setItem('Username', res.data.username)
        toast.success('Logged in successfully')
        navigate('/Admin')
      } else {
        toast.error('Invalid credentials')
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Invalid credentials')
      } else {
        toast.error('Something went wrong. Please try again.')
      }
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8">

        {/* Logo / Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow mb-3">
            <span className="text-white font-extrabold text-2xl leading-none">H</span>
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Fawad Honda Center</h1>
          <p className="text-xs text-gray-400 mt-1">Admin Portal</p>
        </div>

        <h2 className="text-lg font-bold text-center text-black mb-6">Admin Login</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition-colors duration-300"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

      </div>
    </div>
  )
}

export default Login
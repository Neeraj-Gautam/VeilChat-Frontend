import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import authService from '../services/auth.service'
import useAuthStore from '../store/useAuthStore'
import { initSocket } from '../sockets/socket'

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { data } = await authService.login(form)
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken)
      initSocket(data.data.accessToken)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.[0]?.message
        || err.message
        || 'Login failed'
      setError(msg)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Sign in</h1>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">
          Login
        </button>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400">
          No account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </form>
    </div>
  )
}

export default LoginPage

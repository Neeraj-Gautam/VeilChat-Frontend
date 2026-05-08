import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ChatPage from './pages/ChatPage'
import SettingsPage from './pages/SettingsPage'
import useAuthStore from './store/useAuthStore'
import authService from './services/auth.service'
import { initSocket } from './sockets/socket'

const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore()
  return user ? children : <Navigate to="/login" replace />
}

const App = () => {
  const { setAuth, clearAuth, setAuthLoading, authLoading } = useAuthStore()

  // Silent refresh on app load — runs once
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await authService.refresh()
        setAuth(data.data.user, data.data.accessToken)
        initSocket(data.data.accessToken)
      } catch {
        clearAuth()
      } finally {
        setAuthLoading(false)
      }
    }
    initAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

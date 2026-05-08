import axios from 'axios'
import useAuthStore from '../store/useAuthStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Cache-Control': 'no-cache',
  },
})

// Read token from Zustand memory — never localStorage
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api

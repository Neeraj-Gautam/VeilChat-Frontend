import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  authLoading: true, // true until initial auth check completes

  setAuth: (user, accessToken, refreshToken) => {
    // Store refresh token in localStorage as fallback
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
    set({ user, accessToken, refreshToken })
  },

  clearAuth: () => {
    localStorage.removeItem('refreshToken')
    set({ user: null, accessToken: null, refreshToken: null })
  },

  setAuthLoading: (val) => set({ authLoading: val }),
  
  getRefreshToken: () => {
    // Try memory first, then localStorage
    const state = useAuthStore.getState()
    return state.refreshToken || localStorage.getItem('refreshToken')
  },
}))

export default useAuthStore

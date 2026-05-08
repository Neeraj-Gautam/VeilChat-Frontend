import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  authLoading: true, // true until initial auth check completes

  setAuth: (user, accessToken) => set({ user, accessToken }),

  clearAuth: () => set({ user: null, accessToken: null }),

  setAuthLoading: (val) => set({ authLoading: val }),
}))

export default useAuthStore

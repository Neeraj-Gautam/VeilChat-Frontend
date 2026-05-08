import { create } from 'zustand'

const useOnlineStore = create((set) => ({
  onlineUsers: new Set(),
  lastSeen: {}, // userId → Date

  setOnline: (userId) =>
    set((state) => ({
      onlineUsers: new Set([...state.onlineUsers, userId]),
    })),

  setOffline: (userId) =>
    set((state) => {
      const updated = new Set(state.onlineUsers)
      updated.delete(userId)
      return {
        onlineUsers: updated,
        lastSeen: { ...state.lastSeen, [userId]: new Date() },
      }
    }),

  setOnlineUsers: (userIds) =>
    set({ onlineUsers: new Set(userIds) }),
}))

export const formatLastSeen = (date) => {
  if (!date) return 'Offline'
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return 'Last seen just now'
  if (diff < 3600) return `Last seen ${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `Last seen ${Math.floor(diff / 3600)}h ago`
  return `Last seen ${Math.floor(diff / 86400)}d ago`
}

export default useOnlineStore

import { create } from 'zustand'

// typingUsers: { [chatId]: Set<userId> }
const useTypingStore = create((set) => ({
  typingUsers: {},

  setTyping: (chatId, userId) =>
    set((state) => {
      const current = new Set(state.typingUsers[chatId] || [])
      current.add(userId)
      return { typingUsers: { ...state.typingUsers, [chatId]: current } }
    }),

  clearTyping: (chatId, userId) =>
    set((state) => {
      const current = new Set(state.typingUsers[chatId] || [])
      current.delete(userId)
      return { typingUsers: { ...state.typingUsers, [chatId]: current } }
    }),
}))

export default useTypingStore

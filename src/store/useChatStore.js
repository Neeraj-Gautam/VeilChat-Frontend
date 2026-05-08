import { create } from 'zustand'

const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  unreadCounts: {},

  setChats: (chats) => set({ chats }),

  setActiveChat: (chat) =>
    set((state) => ({
      activeChat: chat,
      messages: [],
      unreadCounts: chat
        ? { ...state.unreadCounts, [chat._id]: 0 }
        : state.unreadCounts,
    })),

  setMessages: (messages) =>
    set({
      messages: Array.isArray(messages)
        ? [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        : [],
    }),

  markMessagesRead: (chatId, readByUserId) =>
    set((state) => ({
      messages: state.messages.map((m) => {
        const mChatId = m.chat?._id || m.chat
        if (mChatId?.toString() !== chatId) return m
        if ((m.readBy || []).some((id) => (id?._id || id)?.toString() === readByUserId)) return m
        return { ...m, readBy: [...(m.readBy || []), readByUserId] }
      }),
    })),

  deleteMessage: (messageId, deleteFor) =>
    set((state) => {
      if (deleteFor === 'everyone') {
        return {
          messages: state.messages.map((m) =>
            m._id === messageId
              ? { ...m, isDeleted: true, content: 'This message was deleted' }
              : m
          ),
        }
      }
      return { messages: state.messages.filter((m) => m._id !== messageId) }
    }),

  deleteMessages: (messageIds, deleteFor) =>
    set((state) => {
      const ids = new Set((messageIds || []).map((id) => id?.toString()).filter(Boolean))
      if (ids.size === 0) return {}

      if (deleteFor === 'everyone') {
        return {
          messages: state.messages.map((m) =>
            ids.has(m._id?.toString())
              ? { ...m, isDeleted: true, content: 'This message was deleted' }
              : m
          ),
        }
      }

      return { messages: state.messages.filter((m) => !ids.has(m._id?.toString())) }
    }),

  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, ...updates } : m
      ),
    })),

  addMessage: (message) => {
    const { activeChat, messages, chats, unreadCounts } = get()
    const msgChatId = message.chat?._id || message.chat

    if (messages.some((m) => m._id === message._id)) return

    if (activeChat?._id === msgChatId) {
      const updated = [...messages, message].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      )
      set({ messages: updated })
    } else {
      set({
        unreadCounts: {
          ...unreadCounts,
          [msgChatId]: (unreadCounts[msgChatId] || 0) + 1,
        },
      })
    }

    const targetChat = chats.find((c) => c._id === msgChatId)
    if (!targetChat) return
    set({
      chats: [
        { ...targetChat, lastMessage: message },
        ...chats.filter((c) => c._id !== msgChatId),
      ],
    })
  },

  updateChat: (updatedChat) =>
    set((state) => ({
      chats: state.chats.map((c) => (c._id === updatedChat._id ? updatedChat : c)),
      activeChat: state.activeChat?._id === updatedChat._id ? updatedChat : state.activeChat,
    })),

  clearMessages: (chatId) =>
    set((state) => {
      // Clear messages for the specified chat
      if (state.activeChat?._id === chatId) {
        return { messages: [] }
      }
      return {}
    }),
}))

export default useChatStore

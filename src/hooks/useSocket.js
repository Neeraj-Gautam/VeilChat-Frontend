import { useEffect } from 'react'
import { getSocket } from '../sockets/socket'
import useChatStore from '../store/useChatStore'
import useTypingStore from '../store/useTypingStore'
import messageService from '../services/message.service'
import useAuthStore from '../store/useAuthStore'
import useOnlineStore from '../store/useOnlineStore'

const useSocket = () => {
  const { addMessage, activeChat, setMessages, markMessagesRead, deleteMessage, deleteMessages, updateChat, chats, setChats, clearMessages } = useChatStore()
  const { setTyping, clearTyping } = useTypingStore()
  const { setOnline, setOffline, setOnlineUsers } = useOnlineStore()
  const { user, accessToken, setAuth } = useAuthStore()

  // Message + typing listeners — cleanup on unmount
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleMessage = (message) => addMessage(message)
    const handleTyping = ({ chatId, userId }) => {
      console.log('typing received:', chatId, userId)
      setTyping(chatId, userId)
    }
    const handleStopTyping = ({ chatId, userId }) => {
      console.log('stop_typing received:', chatId, userId)
      clearTyping(chatId, userId)
    }
    const handleUserOnline = (userId) => setOnline(userId)
    const handleUserOffline = (userId) => setOffline(userId)
    const handleOnlineUsers = (userIds) => setOnlineUsers(userIds)
    const handleMessagesRead = ({ chatId, readBy }) => markMessagesRead(chatId, readBy)
    const handleMessageDeleted = ({ messageId }) => deleteMessage(messageId, 'everyone')
    const handleMessagesDeleted = ({ messageIds }) => deleteMessages(messageIds, 'everyone')
    
    const handleChatCleared = ({ chatId }) => {
      console.log('Chat cleared:', chatId)
      clearMessages(chatId)
    }
    
    const handleUserAvatarUpdated = ({ userId, avatar }) => {
      console.log('User avatar updated:', userId, avatar)
      
      // Update current user's auth state if it's them
      if (user?._id === userId) {
        setAuth({ ...user, avatar }, accessToken)
      }
      
      // ALWAYS update chats list for any user's avatar change
      const updatedChats = chats.map(chat => {
        const updatedParticipants = chat.participants?.map(p => 
          (p._id === userId || p === userId) ? { ...p, avatar } : p
        )
        return updatedParticipants ? { ...chat, participants: updatedParticipants } : chat
      })
      setChats(updatedChats)
      
      // ALWAYS update active chat if needed
      if (activeChat) {
        const updatedParticipants = activeChat.participants?.map(p =>
          (p._id === userId || p === userId) ? { ...p, avatar } : p
        )
        if (updatedParticipants) {
          updateChat({ ...activeChat, participants: updatedParticipants })
        }
      }
    }
    
    const handleGroupAvatarUpdated = ({ chatId, groupAvatar }) => {
      console.log('Group avatar updated:', chatId, groupAvatar)
      
      // Update chats list
      const updatedChats = chats.map(chat =>
        chat._id === chatId ? { ...chat, groupAvatar } : chat
      )
      setChats(updatedChats)
      
      // Update active chat if it's the same group
      if (activeChat?._id === chatId) {
        updateChat({ ...activeChat, groupAvatar })
      }
    }

    socket.on('receive_message', handleMessage)
    socket.on('typing', handleTyping)
    socket.on('stop_typing', handleStopTyping)
    socket.on('user_online', handleUserOnline)
    socket.on('user_offline', handleUserOffline)
    socket.on('online_users', handleOnlineUsers)
    socket.on('messages_read', handleMessagesRead)
    socket.on('message_deleted', handleMessageDeleted)
    socket.on('messages_deleted', handleMessagesDeleted)
    socket.on('chat_cleared', handleChatCleared)
    socket.on('user_avatar_updated', handleUserAvatarUpdated)
    socket.on('group_avatar_updated', handleGroupAvatarUpdated)

    return () => {
      socket.off('receive_message', handleMessage)
      socket.off('typing', handleTyping)
      socket.off('stop_typing', handleStopTyping)
      socket.off('user_online', handleUserOnline)
      socket.off('user_offline', handleUserOffline)
      socket.off('online_users', handleOnlineUsers)
      socket.off('messages_read', handleMessagesRead)
      socket.off('message_deleted', handleMessageDeleted)
      socket.off('messages_deleted', handleMessagesDeleted)
      socket.off('chat_cleared', handleChatCleared)
      socket.off('user_avatar_updated', handleUserAvatarUpdated)
      socket.off('group_avatar_updated', handleGroupAvatarUpdated)
    }
  }, [addMessage, setTyping, clearTyping, setOnline, setOffline, setOnlineUsers, markMessagesRead, deleteMessage, deleteMessages, clearMessages, user, accessToken, setAuth, chats, setChats, activeChat, updateChat])

  // Correct order: fetch → setMessages → join_chat
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !activeChat) return

    const loadAndJoin = async () => {
      try {
        const { data } = await messageService.getMessages(activeChat._id)
        setMessages(data.data)
        // Mark messages as read when opening chat
        await messageService.markAsRead(activeChat._id)
        socket.emit('join_chat', activeChat._id)
      } catch (err) {
        console.error('Failed to load messages:', err)
      }
    }

    // If socket not connected yet, wait for it
    if (socket.connected) {
      loadAndJoin()
    } else {
      socket.once('connected', loadAndJoin)
      return () => socket.off('connected', loadAndJoin)
    }
  }, [activeChat, setMessages])
}

export default useSocket

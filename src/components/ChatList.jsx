import { useState, useMemo } from 'react'
import useChatStore from '../store/useChatStore'
import useAuthStore from '../store/useAuthStore'
import useOnlineStore from '../store/useOnlineStore'
import useTypingStore from '../store/useTypingStore'
import chatService from '../services/chat.service'
import { formatTime } from '../utils/formatTime'
import AvatarViewer from './AvatarViewer'

const ChatList = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [avatarViewer, setAvatarViewer] = useState(null)
  
  // Zustand selectors — prevent full re-render on unrelated state changes
  const chats = useChatStore((s) => s.chats)
  const activeChat = useChatStore((s) => s.activeChat)
  const setActiveChat = useChatStore((s) => s.setActiveChat)
  const setChats = useChatStore((s) => s.setChats)
  const unreadCounts = useChatStore((s) => s.unreadCounts)
  const user = useAuthStore((s) => s.user)
  const onlineUsers = useOnlineStore((s) => s.onlineUsers)
  const typingUsers = useTypingStore((s) => s.typingUsers)

  const getChatName = (chat) => {
    if (chat.isGroupChat) return chat.groupName
    return chat.participants.find((p) => p._id !== user._id)?.name || 'Unknown'
  }

  const getOtherUser = (chat) =>
    chat.isGroupChat ? null : chat.participants.find((p) => p._id !== user._id)

  const handlePinChat = async (e, chat) => {
    e.stopPropagation()
    try {
      const { data } = await chatService.togglePinChat(chat._id)
      // Update the chat in the list
      const updatedChats = chats.map(c => c._id === chat._id ? data.data : c)
      setChats(updatedChats)
    } catch (err) {
      console.error('Failed to pin chat:', err)
    }
  }

  const isChatPinned = (chat) => {
    return chat.pinnedBy?.some(id => (id._id || id).toString() === user._id.toString())
  }

  // Get typing users for a chat
  const getTypingUsers = (chatId) => {
    const typers = typingUsers[chatId]
    if (!typers) return []
    
    // Convert Set to Array
    const typersArray = Array.from(typers)
    
    return typersArray
      .filter((uid) => uid !== user._id)
      .map((uid) => {
        // Find the user in all chats
        for (const chat of chats) {
          const participant = chat.participants.find(p => p._id === uid)
          if (participant) return participant.name
        }
        return 'Someone'
      })
  }

  // Format typing text
  const getTypingText = (chatId, isGroupChat) => {
    const typers = getTypingUsers(chatId)
    if (typers.length === 0) return null
    
    if (isGroupChat) {
      if (typers.length === 1) {
        return `${typers[0]} is typing`
      } else if (typers.length === 2) {
        return `${typers[0]} and ${typers[1]} are typing`
      } else if (typers.length === 3) {
        return `${typers[0]}, ${typers[1]} and ${typers[2]} are typing`
      } else {
        return 'A lot of people are typing'
      }
    } else {
      return 'typing'
    }
  }

  // Filter and search chats
  const filteredChats = useMemo(() => {
    let result = [...chats]

    // Apply filter
    if (activeFilter === 'unread') {
      result = result.filter((chat) => (unreadCounts[chat._id] || 0) > 0)
    } else if (activeFilter === 'pinned') {
      result = result.filter((chat) => isChatPinned(chat))
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((chat) => {
        const name = getChatName(chat).toLowerCase()
        const lastMsg = chat.lastMessage?.content?.toLowerCase() || ''
        return name.includes(query) || lastMsg.includes(query)
      })
    }

    // Sort: Pinned chats first, then by last message time
    result.sort((a, b) => {
      const aPinned = isChatPinned(a)
      const bPinned = isChatPinned(b)
      
      // If one is pinned and the other isn't, pinned comes first
      if (aPinned && !bPinned) return -1
      if (!aPinned && bPinned) return 1
      
      // If both pinned or both not pinned, sort by last message time
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0
      return bTime - aTime // Most recent first
    })

    return result
  }, [chats, activeFilter, searchQuery, unreadCounts])

  return (
    <div className="flex flex-col h-full bg-theme-chat-bg">
      {/* Search Bar */}
      <div className="px-3 py-2.5 border-b border-theme-border">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search or start a new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-11 pl-9 pr-3 py-2.5 text-sm bg-theme-compose-bg text-theme-compose-text placeholder:text-theme-compose-muted border border-theme-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-2 border-b border-theme-border flex items-center gap-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`min-h-11 px-3 py-2 text-xs font-medium rounded-full transition-all btn-hover ${
            activeFilter === 'all'
              ? 'bg-theme-primary text-theme-text-on-primary shadow-sm'
              : 'bg-theme-input-bg text-theme-compose-text hover:bg-theme-border/30'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveFilter('unread')}
          className={`min-h-11 px-3 py-2 text-xs font-medium rounded-full transition-all btn-hover ${
            activeFilter === 'unread'
              ? 'bg-theme-primary text-theme-text-on-primary shadow-sm'
              : 'bg-theme-input-bg text-theme-compose-text hover:bg-theme-border/30'
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setActiveFilter('pinned')}
          className={`min-h-11 px-3 py-2 text-xs font-medium rounded-full transition-all btn-hover ${
            activeFilter === 'pinned'
              ? 'bg-theme-primary text-theme-text-on-primary shadow-sm'
              : 'bg-theme-input-bg text-theme-compose-text hover:bg-theme-border/30'
          }`}
        >
          Pinned
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {filteredChats.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 py-12 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-theme-input-bg flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {searchQuery ? 'No chats found' : activeFilter === 'unread' ? 'No unread chats' : activeFilter === 'pinned' ? 'No pinned chats' : 'No conversations yet'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {searchQuery ? 'Try a different search term' : 'Start a new chat to get going'}
            </p>
          </div>
        )}
        {filteredChats.map((chat) => {
          const unread = unreadCounts[chat._id] || 0
          const otherUser = getOtherUser(chat)
          const isOnline = otherUser ? onlineUsers.has(otherUser._id) : false
          const isPinned = isChatPinned(chat)
          
          return (
            <div
              key={chat._id}
              onClick={() => setActiveChat(chat)}
              className={`relative group flex items-center gap-3 px-3 py-2.5 my-0.5 rounded-xl cursor-pointer transition-all duration-200 ${
                activeChat?._id === chat._id
                  ? 'bg-theme-primary/10 shadow-sm'
                  : 'hover:bg-theme-input-bg/60'
              }`}
            >
              <div className="relative shrink-0">
                {chat.isGroupChat ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (chat.groupAvatar) {
                        setAvatarViewer({ avatar: chat.groupAvatar, name: chat.groupName })
                      }
                    }}
                    className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold hover:opacity-80 transition ${
                      activeChat?._id === chat._id
                        ? 'bg-theme-primary text-theme-text-on-primary'
                        : 'bg-theme-primary/20 text-theme-primary'
                    }`}
                  >
                    {chat.groupAvatar ? (
                      <img src={chat.groupAvatar} alt={chat.groupName} className="w-full h-full object-cover" />
                    ) : (
                      getChatName(chat)[0]?.toUpperCase()
                    )}
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (otherUser?.avatar) {
                        setAvatarViewer({ avatar: otherUser.avatar, name: otherUser.name })
                      }
                    }}
                    className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold hover:opacity-80 transition ${
                      activeChat?._id === chat._id
                        ? 'bg-theme-primary text-theme-text-on-primary'
                        : 'bg-theme-primary/20 text-theme-primary'
                    }`}
                  >
                    {otherUser?.avatar ? (
                      <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full object-cover" />
                    ) : (
                      getChatName(chat)[0]?.toUpperCase()
                    )}
                  </button>
                )}
                {isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-theme-chat-bg rounded-full shadow-sm" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="text-[13px] font-semibold text-theme-text-on-other truncate">
                      {getChatName(chat)}
                    </span>
                    {isPinned && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-yellow-500 shrink-0 -rotate-45">
                        <path d="M9.5 1.5a1.5 1.5 0 0 1 1.5 1.5v1.5h1.5a1.5 1.5 0 0 1 0 3h-1.5v1.5a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5V7.5H3a1.5 1.5 0 0 1 0-3h1.5V3a1.5 1.5 0 0 1 1.5-1.5h3z" />
                        <path d="M7 11.5v3a.5.5 0 0 0 1 0v-3h-1z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {chat.lastMessage && (
                      <span className={`text-[11px] ${
                        unread > 0
                          ? 'text-theme-primary font-medium'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {formatTime(chat.lastMessage.createdAt)}
                      </span>
                    )}
                    {unread > 0 && (
                      <span className="bg-theme-primary text-theme-text-on-primary text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-sm">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                </div>
                <p className={`text-xs truncate mt-0.5 leading-relaxed ${
                  unread > 0
                    ? 'text-gray-700 dark:text-gray-200 font-medium'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {getTypingText(chat._id, chat.isGroupChat) ? (
                    <span className="flex items-center gap-1.5 text-theme-primary font-medium">
                      <span>{getTypingText(chat._id, chat.isGroupChat)}</span>
                      <span className="typing-dots-small">
                        <span></span>
                        <span></span>
                        <span></span>
                      </span>
                    </span>
                  ) : chat.lastMessage ? (
                    <>
                      {chat.lastMessage.sender?._id === user._id || chat.lastMessage.sender === user._id ? (
                        <span className="text-gray-500 text-theme-text-on-other">You: </span>
                      ) : null}
                      {chat.lastMessage.type === 'system' ? (
                        <span className="italic">{chat.lastMessage.content}</span>
                      ) : chat.lastMessage.content?.match(/https?:\/\/[^\s]+/) ? (
                        <span className="flex items-center gap-1 min-w-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span className="truncate">{chat.lastMessage.content}</span>
                        </span>
                      ) : (
                        chat.lastMessage.content
                      )}
                    </>
                  ) : (
                    <span className="italic text-gray-400 dark:text-gray-600">No messages yet</span>
                  )}
                </p>
              </div>
            
            {/* Pin button - always visible */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePinChat(e, chat)
              }}
              className={`touch-target shrink-0 flex items-center justify-center rounded-lg transition-all btn-hover ${
                isPinned 
                  ? 'text-yellow-500 hover:text-yellow-600' 
                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
              }`}
              title={isPinned ? 'Unpin chat' : 'Pin chat'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
          )
        })}
      </div>

      {avatarViewer && (
        <AvatarViewer
          avatar={avatarViewer.avatar}
          name={avatarViewer.name}
          onClose={() => setAvatarViewer(null)}
        />
      )}
    </div>
  )
}

export default ChatList

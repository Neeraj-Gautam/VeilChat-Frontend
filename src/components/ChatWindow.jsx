import { useState, useEffect, useRef, useCallback } from 'react'
import useAuthStore from '../store/useAuthStore'
import useTypingStore from '../store/useTypingStore'
import useOnlineStore, { formatLastSeen } from '../store/useOnlineStore'
import messageService from '../services/message.service'
import uploadService from '../services/upload.service'
import { getSocket } from '../sockets/socket'
import { formatTime } from '../utils/formatTime'
import useChatStore from '../store/useChatStore'
import useThemeStore from '../store/useThemeStore'
import ForwardModal from './ForwardModal'
import MessageContent from './MessageContent'
import ImageViewer from './ImageViewer'
import AvatarViewer from './AvatarViewer'
import EmojiPicker from './EmojiPicker'
import { isEmojiOnly, getEmojiSize } from '../utils/emojiDetector'

const Ticks = ({ msg, userId }) => {
  if (msg.sender?._id !== userId && msg.sender !== userId) return null
  const readByOthers = (msg.readBy || []).some((id) => {
    const idStr = id?._id || id
    return idStr?.toString() !== userId?.toString()
  })
  if (readByOthers) {
    return (
      <span className="inline-flex items-center ml-1">
        <svg className="w-4 h-3 text-white opacity-90" viewBox="0 0 20 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1,6 5,10 11,2" /><polyline points="7,6 11,10 17,2" />
        </svg>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center ml-1">
      <svg className="w-3 h-3 text-white opacity-50" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1,6 4,10 10,2" />
      </svg>
    </span>
  )
}

const ChatWindow = ({ onToggleInfo }) => {
  const activeChat = useChatStore((s) => s.activeChat)
  const messages = useChatStore((s) => s.messages)
  const addMessage = useChatStore((s) => s.addMessage)
  const deleteMessageFromStore = useChatStore((s) => s.deleteMessage)
  const updateMessage = useChatStore((s) => s.updateMessage)
  const clearMessages = useChatStore((s) => s.clearMessages)
  const user = useAuthStore((s) => s.user)
  const typingUsers = useTypingStore((s) => s.typingUsers)
  const onlineUsers = useOnlineStore((s) => s.onlineUsers)
  const lastSeen = useOnlineStore((s) => s.lastSeen)

  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [ctxMenu, setCtxMenu] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [forwardMsg, setForwardMsg] = useState(null)
  const [forwardMsgs, setForwardMsgs] = useState(null)
  const [pinnedMsg, setPinnedMsg] = useState(null)
  const [currentPinnedIndex, setCurrentPinnedIndex] = useState(0)
  const [showPinnedList, setShowPinnedList] = useState(false)
  const [imageViewer, setImageViewer] = useState(null)
  const [avatarViewer, setAvatarViewer] = useState(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [downloading, setDownloading] = useState(null)
  const [showHeaderMenu, setShowHeaderMenu] = useState(false)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const containerRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const isTypingRef = useRef(false)
  const messageRefs = useRef({})
  const longPressTimerRef = useRef(null)
  const emojiAnchorRef = useRef(null)
  const composeInputRef = useRef(null)
  const theme = useThemeStore((s) => s.theme)

  const isNearBottom = () => {
    const el = containerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop <= el.clientHeight + 100
  }

  const scrollToBottom = useCallback((force = false, instant = false) => {
    const container = containerRef.current
    if (!container) return
    
    if (force || isNearBottom()) {
      // Directly set scrollTop to scroll to bottom
      if (instant) {
        container.scrollTop = container.scrollHeight
      } else {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        })
      }
    }
  }, [])

  // #region agent log
  const logComposeInputColors = useCallback((trigger) => {
    const el = composeInputRef.current
    const root = document.documentElement
    const rootCs = getComputedStyle(root)
    const elCs = el ? getComputedStyle(el) : null
    fetch('http://127.0.0.1:7900/ingest/c3f3a866-d3d9-4d4c-87f5-b836903ca427', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd906ca' },
      body: JSON.stringify({
        sessionId: 'd906ca',
        runId: 'compose-verify',
        hypothesisId: 'H1',
        location: 'ChatWindow.jsx:compose-colors',
        message: 'compose input computed colors',
        data: {
          trigger,
          dataTheme: root.getAttribute('data-theme'),
          themeBase: theme.base,
          themeMode: theme.mode,
          htmlHasDarkClass: root.classList.contains('dark'),
          composeBgVar: rootCs.getPropertyValue('--color-compose-bg').trim(),
          composeTextVar: rootCs.getPropertyValue('--color-compose-text').trim(),
          computedColor: elCs?.color ?? null,
          computedBg: elCs?.backgroundColor ?? null,
          usesComposeTextClass: el?.className?.includes('text-theme-compose-text') ?? false,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
  }, [theme.base, theme.mode])

  useEffect(() => {
    logComposeInputColors('theme-change')
  }, [theme.base, theme.mode, logComposeInputColors])
  // #endregion

  // Fetch messages when activeChat changes
  useEffect(() => {
    if (!activeChat) return
    
    const fetchMessages = async () => {
      try {
        const { data } = await messageService.getMessages(activeChat._id)
        useChatStore.getState().setMessages(data.data || [])
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      }
    }
    
    fetchMessages()
  }, [activeChat?._id])

  // Scroll to bottom when messages are loaded for a chat
  useEffect(() => {
    if (!activeChat || messages.length === 0) return
    
    // Use requestAnimationFrame to ensure DOM has fully rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = containerRef.current
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    })
  }, [activeChat?._id, messages.length])
  
  // Smooth scroll for new individual messages
  useEffect(() => { 
    if (messages.length > 0 && isNearBottom()) {
      scrollToBottom(false, false)
    }
  }, [messages.length])

  const emitTyping = useCallback((chatId) => {
    const socket = getSocket()
    if (!socket || !chatId) return
    
    // Debounce typing event - only emit if not already typing
    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket.emit('typing', { chatId })
    }
    
    // Clear previous timeout
    clearTimeout(typingTimeoutRef.current)
    
    // Stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { chatId })
      isTypingRef.current = false
    }, 1000)
  }, [])

  const handleChange = (e) => {
    setContent(e.target.value)
    if (activeChat) {
      // Debounce typing emission by 300ms
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(activeChat._id)
      }, 300)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => () => {
    // Cleanup: stop typing and clear timeout on unmount
    clearTimeout(typingTimeoutRef.current)
    const socket = getSocket()
    if (socket && activeChat && isTypingRef.current) {
      socket.emit('stop_typing', { chatId: activeChat._id })
    }
  }, [activeChat])

  useEffect(() => {
    const close = () => {
      setCtxMenu(null)
      setShowPinnedList(false)
      setShowHeaderMenu(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const toggleSelected = useCallback((messageId) => {
    if (!messageId) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(messageId)) next.delete(messageId)
      else next.add(messageId)
      return next
    })
  }, [])

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const selectAll = useCallback((ids) => {
    setSelectedIds(new Set(ids))
  }, [])

  const handleSend = async () => {
    if (!content.trim() || !activeChat || sending) return
    const socket = getSocket()
    if (socket) socket.emit('stop_typing', { chatId: activeChat._id })
    clearTimeout(typingTimeoutRef.current)
    isTypingRef.current = false
    setSending(true)
    try {
      const { data } = await messageService.sendMessage({
        chatId: activeChat._id,
        content: content.trim(),
        type: 'text',
        replyTo: replyTo?._id,
      })
      addMessage(data.data)
      setContent('')
      setReplyTo(null)
      scrollToBottom(true, true)
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || !activeChat) return

    setUploading(true)
    try {
      // Upload files to Cloudinary
      const uploadResponse =
        files.length === 1
          ? await uploadService.uploadFile(files[0])
          : await uploadService.uploadFiles(files)

      const uploaded = Array.isArray(uploadResponse.data)
        ? uploadResponse.data
        : uploadResponse.data
          ? [uploadResponse.data]
          : []

      if (!uploaded.length || !uploaded.every((u) => u?.public_id && u?.url)) {
        throw new Error('Upload response missing file data')
      }

      // WhatsApp-like: one message per file
      for (const u of uploaded) {
        const messageType = u.type === 'image' ? 'image' : 'file'
        const { data } = await messageService.sendMessage({
          chatId: activeChat._id,
          content: '',
          type: messageType,
          attachments: [
            {
              url: u.url,
              public_id: u.public_id,
              type: u.type,
              name: u.name,
              size: u.size,
            },
          ],
        })
        addMessage(data.data)
      }
      scrollToBottom(true, true)
    } catch (err) {
      console.error('Failed to upload file:', err)
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDownload = async (e, url, filename) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Downloading file:', { url, filename, downloading })
    
    if (downloading) {
      console.log('Already downloading something else, aborting.')
      return
    }
    
    setDownloading(url)
    try {
      console.log('Fetching URL...')
      const response = await fetch(url)
      console.log('Response received:', response.status, response.ok)
      
      const blob = await response.blob()
      console.log('Blob created, size:', blob.size)
      
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      console.log('Link clicked for download!')
      
      document.body.removeChild(link)
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000)
    } catch (error) {
      console.error('Error downloading file:', error)
      // Fallback to opening in new tab
      window.open(url, '_blank')
    } finally {
      console.log('Resetting downloading state.')
      setDownloading(null)
    }
  }

  const handleDeleteMessage = async (msg, deleteFor) => {
    try {
      await messageService.deleteMessage(msg._id, deleteFor)
      deleteMessageFromStore(msg._id, deleteFor, user._id)
    } catch (err) {
      console.error('Failed to delete message:', err)
    }
    setCtxMenu(null)
  }

  const handleBulkDelete = async (deleteFor) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    try {
      await messageService.bulkDeleteMessages(ids, deleteFor)
      // Update local store immediately; other users update via socket when deleteFor === 'everyone'
      if (deleteFor === 'everyone') {
        ids.forEach((id) => deleteMessageFromStore(id, 'everyone', user._id))
      } else {
        ids.forEach((id) => deleteMessageFromStore(id, 'me', user._id))
      }
    } catch (err) {
      console.error('Failed to bulk delete messages:', err)
    } finally {
      exitSelectionMode()
    }
  }
  const handlePin = async (msg) => {
    try {
      const response = await messageService.pinMessage(msg._id)
      // Update the message in the store immediately
      updateMessage(msg._id, { isPinned: !msg.isPinned })
      
      // Update the pinned message display
      if (!msg.isPinned) {
        // Message was just pinned
        setPinnedMsg({ ...msg, isPinned: true })
      } else {
        // Message was unpinned - check if there are other pinned messages
        const remainingPinned = messages.filter(m => m.isPinned && m._id !== msg._id)
        if (remainingPinned.length > 0) {
          setPinnedMsg(remainingPinned[0])
          setCurrentPinnedIndex(0)
        } else {
          setPinnedMsg(null)
        }
      }
    } catch (err) { 
      console.error(err) 
    }
    setCtxMenu(null)
  }

  const handleStar = async (msg) => {
    try {
      await messageService.starMessage(msg._id)
    } catch (err) { console.error(err) }
    setCtxMenu(null)
  }

  const handleCopy = (msg) => {
    navigator.clipboard.writeText(msg.content || '')
    setCtxMenu(null)
  }

  const handleReply = (msg) => {
    setReplyTo(msg)
    setCtxMenu(null)
  }

  const handleClearChat = async (clearFor) => {
    try {
      await messageService.clearChat(activeChat._id, clearFor)
      clearMessages(activeChat._id)
      setShowHeaderMenu(false)
    } catch (err) {
      console.error('Failed to clear chat:', err)
      alert('Failed to clear chat. Please try again.')
    }
  }

  if (!activeChat) return null

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  )

  const ownerId = activeChat.admin?._id || activeChat.admin
  const isGroupOwner = ownerId?.toString() === user._id
  const isGroupAdmin = isGroupOwner || (activeChat.admins || []).some(
    (a) => (a._id || a)?.toString() === user._id
  )

  const canDeleteForEveryone = (msg) => {
    const isSender = msg.sender?._id === user._id || msg.sender === user._id
    if (!activeChat.isGroupChat) return isSender
    return isGroupAdmin || isSender
  }

  const canClearForEveryone = () => {
    if (!activeChat.isGroupChat) return true // Any participant in 1-to-1
    return isGroupAdmin // Only admins in groups
  }

  const selectedCount = selectedIds.size
  const selectableMessages = sortedMessages.filter((m) => m.type !== 'system' && !m.isDeleted)
  const selectableIds = selectableMessages.map((m) => m._id)
  const selectedMessages = selectedCount ? selectableMessages.filter((m) => selectedIds.has(m._id)) : []
  const canDeleteAllSelectedForEveryone =
    selectedMessages.length > 0 &&
    selectedMessages.every((m) => !m.isDeleted && m.type !== 'system' && canDeleteForEveryone(m))

  const otherUser = activeChat.isGroupChat
    ? null
    : activeChat.participants.find((p) => p._id !== user._id)
  const isOnline = otherUser ? onlineUsers.has(otherUser._id) : false
  const statusText = isOnline ? 'Online' : formatLastSeen(lastSeen[otherUser?._id])

  const pinnedMessages = sortedMessages.filter((msg) => msg.isPinned && !msg.isDeleted)

  // Helper to format date separator
  const formatDateSeparator = (date) => {
    const msgDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (msgDate.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return msgDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }
  }

  // Check if we need a date separator
  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true
    const currentDate = new Date(currentMsg.createdAt).toDateString()
    const prevDate = new Date(prevMsg.createdAt).toDateString()
    return currentDate !== prevDate
  }

  const scrollToPinnedMessage = (msgId) => {
    const msgElement = messageRefs.current[msgId]
    if (msgElement) {
      msgElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      msgElement.classList.add('highlight-message')
      setTimeout(() => msgElement.classList.remove('highlight-message'), 2000)
    }
  }

  const handleNavigatePinned = (direction) => {
    if (pinnedMessages.length === 0) return
    let newIndex
    if (direction === 'up') {
      newIndex = currentPinnedIndex > 0 ? currentPinnedIndex - 1 : pinnedMessages.length - 1
    } else {
      newIndex = currentPinnedIndex < pinnedMessages.length - 1 ? currentPinnedIndex + 1 : 0
    }
    setCurrentPinnedIndex(newIndex)
    setPinnedMsg(pinnedMessages[newIndex])
    scrollToPinnedMessage(pinnedMessages[newIndex]._id)
  }

  useEffect(() => {
    if (pinnedMessages.length > 0 && !pinnedMsg) {
      setPinnedMsg(pinnedMessages[0])
      setCurrentPinnedIndex(0)
    } else if (pinnedMessages.length === 0) {
      setPinnedMsg(null)
      setCurrentPinnedIndex(0)
    }
  }, [messages])

  const activeTypers = activeChat
    ? [...(typingUsers[activeChat._id] || [])]
        .filter((uid) => uid !== user._id)
        .map((uid) => {
          const p = activeChat.participants.find((p) => p._id === uid)
          return p?.name || 'Someone'
        })
    : []

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      {selectionMode ? (
        <div className="px-4 py-3 border-b border-theme-border bg-theme-header-bg flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={exitSelectionMode}
              className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white p-1 rounded-lg"
              title="Cancel selection"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M11.03 3.22a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 4.81l-6.47 6.47a.75.75 0 11-1.06-1.06l7.56-7.5z" clipRule="evenodd" transform="rotate(-90 12 12)" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                {selectedCount} selected
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Tap messages to select</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedCount === selectableIds.length) clearSelection()
                else selectAll(selectableIds)
              }}
              className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white p-2 rounded-lg"
              title={selectedCount === selectableIds.length ? 'Clear selection' : 'Select all'}
            >
              <span className="text-xs font-semibold">
                {selectedCount === selectableIds.length ? 'Clear' : 'All'}
              </span>
            </button>

            <button
              onClick={() => {
                if (selectedMessages.length === 0) return
                setForwardMsgs(selectedMessages)
              }}
              disabled={selectedMessages.length === 0}
              className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white disabled:opacity-40 p-2 rounded-lg"
              title="Forward"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M14.25 5.25a.75.75 0 00-1.5 0v3.19l-6.22-6.22a.75.75 0 10-1.06 1.06l6.22 6.22H8.25a.75.75 0 000 1.5h6a.75.75 0 00.75-.75v-6z" />
                <path d="M6.75 9.75a.75.75 0 01.75.75v7.5h12v-7.5a.75.75 0 011.5 0v7.5A1.5 1.5 0 0119.5 19.5h-12A1.5 1.5 0 016 18v-7.5a.75.75 0 01.75-.75z" />
              </svg>
            </button>

            <button
              onClick={() => {
                if (selectedCount === 0) return
                if (window.confirm(`Delete ${selectedCount} message(s) for you?`)) handleBulkDelete('me')
              }}
              disabled={selectedCount === 0}
              className="text-red-500 hover:text-red-600 disabled:opacity-40 p-2 rounded-lg"
              title="Delete for me"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M9 3.75A.75.75 0 019.75 3h4.5a.75.75 0 01.75.75V5.25h3a.75.75 0 010 1.5h-.75l-.678 13.56A1.875 1.875 0 0114.7 22.125H9.3a1.875 1.875 0 01-1.872-1.815L6.75 6.75H6a.75.75 0 010-1.5h3V3.75zM10.5 5.25h3V4.5h-3v.75z" clipRule="evenodd" />
              </svg>
            </button>

            {canDeleteAllSelectedForEveryone && (
              <button
                onClick={() => {
                  if (selectedCount === 0) return
                  if (window.confirm(`Delete ${selectedCount} message(s) for everyone?`)) handleBulkDelete('everyone')
                }}
                disabled={selectedCount === 0}
                className="text-red-500 hover:text-red-600 disabled:opacity-40 p-2 rounded-lg"
                title="Delete for everyone"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M7.5 3.75A1.5 1.5 0 019 2.25h6a1.5 1.5 0 011.5 1.5V6h3a.75.75 0 010 1.5h-.75l-.6 12.012A2.25 2.25 0 0115.9 21.75H8.1a2.25 2.25 0 01-2.25-2.238L5.25 7.5H4.5a.75.75 0 010-1.5h3V3.75z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="px-3 sm:px-4 py-3 border-b border-theme-border bg-theme-header-bg flex items-center justify-between gap-2 min-w-0 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Back button for mobile */}
            <button
              onClick={() => useChatStore.getState().setActiveChat(null)}
              className="md:hidden touch-target flex items-center justify-center text-gray-400 hover:text-blue-500 rounded-lg btn-hover shrink-0"
              title="Back to chats"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M7.28 7.72a.75.75 0 010 1.06l-2.47 2.47H21a.75.75 0 010 1.5H4.81l2.47 2.47a.75.75 0 11-1.06 1.06l-3.75-3.75a.75.75 0 010-1.06l3.75-3.75a.75.75 0 011.06 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            <div className="relative">
              <button
                onClick={() => {
                  const avatar = activeChat.isGroupChat ? activeChat.groupAvatar : otherUser?.avatar
                  const name = activeChat.isGroupChat ? activeChat.groupName : otherUser?.name
                  if (avatar) {
                    setAvatarViewer({ avatar, name })
                  }
                }}
                className="w-8 h-8 rounded-full overflow-hidden bg-blue-200 dark:bg-blue-900 flex items-center justify-center text-xs font-semibold text-blue-700 dark:text-blue-300 hover:opacity-80 transition cursor-pointer"
              >
                {activeChat.isGroupChat ? (
                  activeChat.groupAvatar ? (
                    <img src={activeChat.groupAvatar} alt={activeChat.groupName} className="w-full h-full object-cover" />
                  ) : (
                    activeChat.groupName?.[0]?.toUpperCase()
                  )
                ) : (
                  otherUser?.avatar ? (
                    <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full object-cover" />
                  ) : (
                    otherUser?.name?.[0]?.toUpperCase()
                  )
                )}
              </button>
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-theme-text-on-primary truncate">
                {activeChat.isGroupChat ? activeChat.groupName : otherUser?.name}
              </p>
              {activeChat.isGroupChat ? (
                activeTypers.length > 0 ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                      {activeTypers.length === 1 ? `${activeTypers[0]} is typing` : `${activeTypers.length} people are typing`}
                    </span>
                    <span className="typing-dots-small text-blue-500 dark:text-blue-400">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500">{activeChat.participants.length} members</p>
                )
              ) : (
                activeTypers.length > 0 ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">typing</span>
                    <span className="typing-dots-small text-blue-500 dark:text-blue-400">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  </div>
                ) : (
                  <p className={`text-xs ${isOnline ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}>{statusText}</p>
                )
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Menu button with dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowHeaderMenu(!showHeaderMenu)
                }}
                className="touch-target flex items-center justify-center text-gray-400 hover:text-blue-500 rounded-lg btn-hover"
                title="More options"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M10.5 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {showHeaderMenu && (
                <div
                  className="absolute right-0 top-full mt-1 z-50 bg-theme-input-bg rounded-xl shadow-xl border border-theme-border py-1 min-w-[200px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      if (window.confirm('Clear all messages for you? This cannot be undone.')) {
                        handleClearChat('me')
                      }
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                    </svg>
                    Clear for me
                  </button>

                  {canClearForEveryone() && (
                    <button
                      onClick={() => {
                        if (window.confirm('Clear all messages for everyone? This cannot be undone and will delete all files.')) {
                          handleClearChat('everyone')
                        }
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M7.5 3.75A1.5 1.5 0 019 2.25h6a1.5 1.5 0 011.5 1.5V6h3a.75.75 0 010 1.5h-.75l-.6 12.012A2.25 2.25 0 0115.9 21.75H8.1a2.25 2.25 0 01-2.25-2.238L5.25 7.5H4.5a.75.75 0 010-1.5h3V3.75z" />
                      </svg>
                      Clear for everyone
                    </button>
                  )}
                </div>
              )}
            </div>

            {activeChat.isGroupChat && (
              <button onClick={() => onToggleInfo?.()} className="touch-target flex items-center justify-center text-gray-400 hover:text-blue-500 rounded-lg btn-hover" title="Group info">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pinned message banner */}
      {pinnedMsg && (
        <div className="relative px-4 py-2 bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-blue-500 text-xs">📌</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-700 dark:text-blue-300 truncate">{pinnedMsg.content}</p>
              {pinnedMessages.length > 1 && (
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
                  {currentPinnedIndex + 1} of {pinnedMessages.length}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {pinnedMessages.length > 1 ? (
              <>
                <button
                  onClick={() => handleNavigatePinned('up')}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded transition-colors"
                  title="Previous pinned message"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M11.47 7.72a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => handleNavigatePinned('down')}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded transition-colors"
                  title="Next pinned message"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowPinnedList(!showPinnedList)
                  }}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded transition-colors"
                  title="Show all pinned messages"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </>
            ) : (
              <button onClick={() => setPinnedMsg(null)} className="text-blue-400 hover:text-blue-600 text-sm">✕</button>
            )}
          </div>

          {/* Pinned messages dropdown */}
          {showPinnedList && pinnedMessages.length > 1 && (
            <div 
              className="absolute top-full left-0 right-0 bg-theme-input-bg border-b border-theme-border shadow-lg max-h-64 overflow-y-auto z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {pinnedMessages.map((msg, index) => (
                <button
                  key={msg._id}
                  onClick={() => {
                    setCurrentPinnedIndex(index)
                    setPinnedMsg(msg)
                    scrollToPinnedMessage(msg._id)
                    setShowPinnedList(false)
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-theme-border hover:bg-theme-chat-bg transition-colors ${
                    currentPinnedIndex === index ? 'bg-theme-chat-bg' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 text-xs mt-0.5">📌</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-theme-text-on-other mb-1">
                        {msg.sender?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-theme-text-on-other line-clamp-2">
                        {msg.content}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={containerRef} className={`flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-3 space-y-3 bg-theme-chat-bg smooth-scroll chat-scroll ${selectionMode ? 'pl-8 sm:pl-4' : ''}`}>
        {sortedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">No messages yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {activeChat.isGroupChat 
                ? 'Be the first to send a message in this group' 
                : `Start a conversation with ${activeChat.participants.find(p => p._id !== user._id)?.name}`}
            </p>
          </div>
        ) : (
          <>
            {sortedMessages.map((msg, index) => {
              const showDateSeparator = shouldShowDateSeparator(msg, sortedMessages[index - 1])
              
              if (msg.type === 'system') {
                return (
                  <div key={msg._id}>
                    {showDateSeparator && (
                      <div className="flex justify-center my-3">
                        <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
                          {formatDateSeparator(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-center my-1">
                      <span className="bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
                        {msg.content}
                      </span>
                    </div>
                  </div>
                )
              }

              const isOwn = msg.sender?._id === user._id || msg.sender === user._id
              const isDeleted = msg.isDeleted
              const isPinned = msg.isPinned

              return (
                <div key={msg._id}>
                  {showDateSeparator && (
                    <div className="flex justify-center my-3">
                      <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <div
                    ref={(el) => (messageRefs.current[msg._id] = el)}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} msg-fade-in`}
                    onClick={(e) => {
                      if (!selectionMode) return
                      e.stopPropagation()
                      toggleSelected(msg._id)
                    }}
                    onTouchStart={(e) => {
                      if (msg.type === 'system' || msg.isDeleted) return
                      if (selectionMode) return
                      clearTimeout(longPressTimerRef.current)
                      longPressTimerRef.current = setTimeout(() => {
                        setSelectionMode(true)
                        toggleSelected(msg._id)
                      }, 450)
                    }}
                    onTouchEnd={() => {
                      clearTimeout(longPressTimerRef.current)
                    }}
                    onTouchMove={() => {
                      clearTimeout(longPressTimerRef.current)
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      if (selectionMode) {
                        toggleSelected(msg._id)
                        return
                      }
                      setCtxMenu({ msg, x: e.clientX, y: e.clientY })
                    }}
                  >
                    <div className={`relative max-w-[min(85%,20rem)] sm:max-w-[70%] ${
                      isEmojiOnly(msg.content) && !msg.attachments?.length && !msg.replyTo && !msg.forwardedFrom && !msg.forwardedFromChat
                        ? 'bg-transparent shadow-none' // No background for emoji-only messages
                        : `px-4 py-2 rounded-2xl shadow-md transition-shadow hover:shadow-lg ${
                            isOwn
                              ? 'bg-theme-message-own text-theme-text-on-own rounded-br-sm'
                              : 'bg-theme-message-other text-theme-text-on-other rounded-bl-sm'
                          }`
                    } text-sm cursor-pointer ${selectionMode && selectedIds.has(msg._id) ? (isOwn ? 'ring-2 ring-purple-300' : 'ring-2 ring-blue-400') : ''}`}>
                      {selectionMode && msg.type !== 'system' && (
                        <div className="absolute -left-3 top-2">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            selectedIds.has(msg._id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'bg-white/80 dark:bg-gray-900/80 border-gray-300 dark:border-gray-600'
                          }`}>
                            {selectedIds.has(msg._id) && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-white">
                                <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.414l-7.2 7.2a1 1 0 01-1.414 0l-3.2-3.2a1 1 0 011.414-1.414l2.493 2.493 6.493-6.493a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      )}
                      {isPinned && (
                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                          isOwn ? 'bg-purple-700' : 'bg-gray-600 dark:bg-gray-700'
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-3 h-3 ${
                            isOwn ? 'text-yellow-300' : 'text-yellow-500'
                          }`}>
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {!isOwn && !isDeleted && (
                        <p className="text-xs font-semibold text-theme-primary mb-1">{msg.sender?.name}</p>
                      )}
                      {(msg.forwardedFrom || msg.forwardedFromChat) && !isDeleted && (
                        <div className="flex items-center gap-1 mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                            <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                          </svg>
                          <span className={`text-xs italic ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                            Forwarded from {msg.forwardedFromChat ? msg.forwardedFromChat.groupName : msg.forwardedFrom?.name}
                          </span>
                        </div>
                      )}
                      {msg.replyTo && !isDeleted && (
                        <div className="bg-black/10 dark:bg-white/10 rounded px-2 py-1 mb-1 border-l-2 border-white/50">
                          <p className="text-xs font-medium opacity-90">{msg.replyTo.sender?.name || 'Unknown'}</p>
                          <p className="text-xs opacity-75 truncate">{msg.replyTo?.content || 'Original message'}</p>
                        </div>
                      )}
                      <MessageContent content={msg.content} isOwn={isOwn} isDeleted={isDeleted} />
                      
                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && !isDeleted && (
                        <div className="mt-2 space-y-2">
                          {msg.attachments.map((attachment, idx) => (
                            <div key={idx}>
                              {attachment.type === 'image' ? (
                                <img 
                                  src={attachment.url} 
                                  alt="attachment" 
                                  className="max-w-full sm:max-w-xs h-auto rounded-lg cursor-pointer hover:opacity-90 transition object-contain"
                                  onClick={() => {
                                    // Get all images from current chat
                                    const allImages = messages
                                      .filter(m => m.attachments?.some(a => a.type === 'image'))
                                      .flatMap(m => 
                                        m.attachments
                                          .filter(a => a.type === 'image')
                                          .map(a => ({
                                            ...a,
                                            sender: m.sender,
                                            createdAt: m.createdAt,
                                          }))
                                      )
                                    
                                    const currentImageIndex = allImages.findIndex(img => img.url === attachment.url)
                                    
                                    setImageViewer({
                                      image: {
                                        ...attachment,
                                        sender: msg.sender,
                                        createdAt: msg.createdAt,
                                      },
                                      allImages,
                                      currentIndex: currentImageIndex,
                                    })
                                  }}
                                />
                              ) : (
                                <a
                                  href={attachment.url}
                                  onClick={(e) => handleDownload(e, attachment.url, attachment.name)}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer ${
                                    isOwn 
                                      ? 'bg-white/15 hover:bg-white/25' 
                                      : 'bg-white/10 hover:bg-white/20'
                                  }`}
                                >
                                  {downloading === attachment.url ? (
                                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
                                      <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm6.905 9.97a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72V18a.75.75 0 001.5 0v-4.19l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
                                      <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
                                    </svg>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{attachment.name || 'File'}</p>
                                    {attachment.size && (
                                      <p className="text-xs opacity-75">{(attachment.size / 1024).toFixed(1)} KB</p>
                                    )}
                                  </div>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {!isDeleted && (
                        <div className={`flex items-center ${
                          isEmojiOnly(msg.content) && !msg.attachments?.length && !msg.replyTo && !msg.forwardedFrom && !msg.forwardedFromChat
                            ? 'justify-center mt-1' // Center timestamp for emoji-only
                            : `justify-end gap-1 mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400'}`
                        }`}>
                          <span className={`text-[10px] ${
                            isEmojiOnly(msg.content) && !msg.attachments?.length && !msg.replyTo && !msg.forwardedFrom && !msg.forwardedFromChat
                              ? 'text-gray-500 dark:text-gray-400' // Neutral color for emoji-only
                              : ''
                          }`}>{formatTime(msg.createdAt)}</span>
                          {isOwn && <Ticks msg={msg} userId={user._id} />}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

        {activeTypers.length > 0 && (
          <div className="flex justify-start msg-fade-in">
            <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-md flex items-center gap-3 min-w-[80px]">
              <div className="typing-dots text-gray-600 dark:text-gray-400">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="px-4 py-2.5 bg-theme-chat-bg border-t border-theme-border flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-1 h-10 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-500 dark:text-blue-400">{replyTo.sender?.name || 'You'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{replyTo.content}</p>
            </div>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2 shrink-0 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-3 border-t border-theme-border bg-theme-input-bg safe-area-bottom shrink-0">
        <div className="flex items-end gap-2 min-w-0">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            multiple
            accept="image/*,application/pdf,.doc,.docx"
          />

          {/* Input bar container */}
          <div className="flex-1 flex items-end bg-theme-compose-bg border border-theme-border/40 rounded-3xl px-1.5 py-1 transition-all focus-within:ring-2 focus-within:ring-theme-primary/40 relative">
            {/* Emoji button */}
            <div className="shrink-0" ref={emojiAnchorRef}>
              <button
                onClick={() => setShowEmojiPicker((v) => !v)}
                className={`touch-target flex items-center justify-center rounded-full transition-colors btn-hover shrink-0 ${
                  showEmojiPicker
                    ? 'text-yellow-500 bg-yellow-500/10'
                    : 'text-theme-compose-muted hover:text-theme-primary'
                }`}
                title="Emoji"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 00-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108.215-.395.634-.936.634-.54 0-.828-.419-.936-.634a1.96 1.96 0 01-.189-.866c0-.298.059-.605.189-.866zm2.023 6.828a.75.75 0 10-1.06-1.06 3.75 3.75 0 01-5.304 0 .75.75 0 00-1.06 1.06 5.25 5.25 0 007.424 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {showEmojiPicker && (
              <EmojiPicker
                anchorRef={emojiAnchorRef}
                onSelect={(emoji) => {
                  setContent((prev) => prev + emoji)
                }}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}

            {/* Text input */}
            <textarea
              ref={composeInputRef}
              rows={1}
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => logComposeInputColors('focus')}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-theme-compose-text placeholder:text-theme-compose-muted py-2 px-1 text-sm caret-theme-primary focus:outline-none resize-none max-h-32 overflow-y-auto leading-5"
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
              }}
            />

            {/* Attachment button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="touch-target flex items-center justify-center text-theme-compose-muted hover:text-theme-primary rounded-full transition-colors disabled:opacity-50 shrink-0 btn-hover"
              title="Attach file"
              type="button"
            >
              {uploading ? (
                <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!content.trim() || sending}
            className={`touch-target rounded-full flex items-center justify-center transition-all duration-200 shrink-0 shadow-md btn-hover ${
              content.trim() && !sending
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:scale-105 active:scale-95'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            }`}
          >
            {sending ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Context menu */}
      {ctxMenu && !ctxMenu.msg.isDeleted && (
        <div
          className="fixed z-[60] bg-theme-input-bg rounded-xl shadow-xl border border-theme-border py-1 min-w-[180px] max-w-[calc(100vw-1rem)]"
          style={{ top: Math.min(ctxMenu.y, window.innerHeight - 320), left: Math.min(ctxMenu.x, window.innerWidth - 200) }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { label: '✓ Select', action: () => { setSelectionMode(true); toggleSelected(ctxMenu.msg._id); setCtxMenu(null) } },
            { label: '↩ Reply', action: () => handleReply(ctxMenu.msg) },
            { label: '⎘ Copy', action: () => handleCopy(ctxMenu.msg), hide: !ctxMenu.msg.content },
            { label: '↪ Forward', action: () => { setForwardMsg(ctxMenu.msg); setCtxMenu(null) } },
            { label: ctxMenu.msg.isPinned ? '📌 Unpin' : '📌 Pin', action: () => handlePin(ctxMenu.msg) },
            { label: '☆ Star', action: () => handleStar(ctxMenu.msg) },
            { divider: true },
            { label: 'Delete for me', action: () => handleDeleteMessage(ctxMenu.msg, 'me'), red: true },
            canDeleteForEveryone(ctxMenu.msg) && { label: 'Delete for everyone', action: () => handleDeleteMessage(ctxMenu.msg, 'everyone'), red: true },
          ].filter(Boolean).map((item, i) =>
            item.divider ? (
              <div key={i} className="my-1 border-t border-theme-border" />
            ) : item.hide ? null : (
              <button
                key={i}
                onClick={item.action}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                  item.red ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}

      {forwardMsg && <ForwardModal message={forwardMsg} onClose={() => setForwardMsg(null)} />}
      {forwardMsgs && (
        <ForwardModal
          messages={forwardMsgs}
          onClose={() => {
            setForwardMsgs(null)
            exitSelectionMode()
          }}
        />
      )}
      
      {imageViewer && (
        <ImageViewer
          image={imageViewer.image}
          allImages={imageViewer.allImages}
          currentIndex={imageViewer.currentIndex}
          onClose={() => setImageViewer(null)}
          onNavigate={(newIndex) => {
            setImageViewer({
              ...imageViewer,
              image: imageViewer.allImages[newIndex],
              currentIndex: newIndex,
            })
          }}
        />
      )}

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

export default ChatWindow

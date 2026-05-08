import { useMemo, useState } from 'react'
import useChatStore from '../store/useChatStore'
import useAuthStore from '../store/useAuthStore'
import messageService from '../services/message.service'

const ForwardModal = ({ message, messages, onClose }) => {
  const chats = useChatStore((s) => s.chats)
  const setChats = useChatStore((s) => s.setChats)
  const user = useAuthStore((s) => s.user)
  const [selected, setSelected] = useState([])
  const [sending, setSending] = useState(false)

  const toForward = useMemo(() => {
    if (Array.isArray(messages) && messages.length > 0) return messages
    if (message) return [message]
    return []
  }, [message, messages])

  const getChatName = (chat) => {
    if (chat.isGroupChat) return chat.groupName
    return chat.participants.find((p) => p._id !== user._id)?.name || 'Unknown'
  }

  const toggle = (chatId) =>
    setSelected((prev) =>
      prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId]
    )

  const handleForward = async () => {
    if (!selected.length || toForward.length === 0) return
    setSending(true)
    try {
      // Forward each selected message; each call returns messages created in target chats
      const updatedChats = [...chats]

      for (const msgToForward of toForward) {
        const { data } = await messageService.forwardMessage(msgToForward._id, selected)
        const forwardedMessages = data.data || []

        forwardedMessages.forEach((msg) => {
          const chatId = msg.chat?._id || msg.chat
          const chatIndex = updatedChats.findIndex((c) => c._id === chatId)

          if (chatIndex !== -1) {
            const chat = updatedChats[chatIndex]
            updatedChats.splice(chatIndex, 1)
            updatedChats.unshift({
              ...chat,
              lastMessage: msg,
              updatedAt: msg.createdAt,
            })
          }
        })
      }

      setChats(updatedChats)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-theme-input-bg rounded-xl shadow-xl w-full max-w-sm mx-4 border border-theme-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border">
          <h3 className="text-sm font-semibold text-theme-text-on-other">
            Forward{toForward.length > 1 ? ` (${toForward.length})` : ''} to...
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => toggle(chat._id)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-theme-chat-bg cursor-pointer border-b border-theme-border last:border-0"
            >
              <div className="w-9 h-9 rounded-full bg-theme-primary/20 flex items-center justify-center text-sm font-semibold text-theme-primary shrink-0">
                {getChatName(chat)[0]?.toUpperCase()}
              </div>
              <p className="flex-1 text-sm text-theme-text-on-other">{getChatName(chat)}</p>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selected.includes(chat._id) ? 'bg-theme-primary border-theme-primary' : 'border-theme-border'
              }`}>
                {selected.includes(chat._id) && <span className="text-theme-text-on-primary text-xs">✓</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-theme-border">
          <button
            onClick={handleForward}
            disabled={!selected.length || sending || toForward.length === 0}
            className="w-full bg-theme-primary text-theme-text-on-primary py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
          >
            {sending ? 'Forwarding...' : `Forward${selected.length ? ` (${selected.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ForwardModal

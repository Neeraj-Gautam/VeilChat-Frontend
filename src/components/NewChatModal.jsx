import { useState, useEffect } from 'react'
import userService from '../services/user.service'
import chatService from '../services/chat.service'
import useChatStore from '../store/useChatStore'

const NewChatModal = ({ onClose }) => {
  const [tab, setTab] = useState('direct') // 'direct' | 'group'
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(null)
  const [selected, setSelected] = useState([]) // for group
  const [groupName, setGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const { setActiveChat, chats, setChats } = useChatStore()

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const { data } = await userService.getUsers(search)
        setUsers(data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    const t = setTimeout(fetchUsers, 300)
    return () => clearTimeout(t)
  }, [search])

  const addToStore = (chat) => {
    setChats(chats.some((c) => c._id === chat._id) ? chats : [chat, ...chats])
    setActiveChat(chat)
    onClose()
  }

  const handleStartChat = async (userId) => {
    setStarting(userId)
    try {
      const { data } = await chatService.accessChat(userId)
      addToStore(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setStarting(null)
    }
  }

  const toggleSelect = (user) => {
    setSelected((prev) =>
      prev.find((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user]
    )
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selected.length < 2) return
    setCreating(true)
    try {
      const { data } = await chatService.createGroup({
        groupName: groupName.trim(),
        participants: selected.map((u) => u._id),
      })
      addToStore(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-theme-input-bg rounded-xl shadow-xl w-full max-w-md mx-4 border border-theme-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border">
          <h2 className="text-sm font-semibold text-theme-text-on-other">New Chat</h2>
          <button onClick={onClose} className="touch-target flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg" aria-label="Close">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-theme-border">
          {['direct', 'group'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelected([]); setSearch('') }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-theme-primary border-b-2 border-theme-primary'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {t === 'direct' ? 'Direct Message' : 'New Group'}
            </button>
          ))}
        </div>

        {/* Group name input */}
        {tab === 'group' && (
          <div className="px-4 pt-3">
            <input
              type="text"
              placeholder="Group name (required)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary bg-theme-input-bg text-theme-text-on-other placeholder-gray-400
                ${!groupName.trim() ? 'border-red-400 dark:border-red-500' : 'border-theme-border'}`}
              autoFocus
            />
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selected.map((u) => (
                  <span key={u._id} className="flex items-center gap-1 bg-theme-primary/20 text-theme-primary text-xs px-2 py-1 rounded-full">
                    {u.name}
                    <button onClick={() => toggleSelect(u)} className="hover:text-red-500">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div className="px-4 py-3 border-b border-theme-border">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-theme-border bg-theme-input-bg text-theme-text-on-other placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary"
            autoFocus
          />
        </div>

        {/* User list */}
        <div className="max-h-60 overflow-y-auto">
          {loading && <p className="text-sm text-gray-400 text-center py-6">Loading...</p>}
          {!loading && users.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No users found</p>}
          {!loading && users.map((u) => {
            const isSelected = selected.find((s) => s._id === u._id)
            return (
              <div key={u._id} className="flex items-center justify-between px-4 py-3 hover:bg-theme-chat-bg border-b border-theme-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-theme-primary/20 flex items-center justify-center text-sm font-semibold text-theme-primary">
                    {u.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-theme-text-on-other">{u.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                  </div>
                </div>
                {tab === 'direct' ? (
                  <button
                    onClick={() => handleStartChat(u._id)}
                    disabled={starting === u._id}
                    className="text-xs bg-theme-primary text-theme-text-on-primary px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {starting === u._id ? '...' : 'Chat'}
                  </button>
                ) : (
                  <button
                    onClick={() => toggleSelect(u)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-theme-primary border-theme-primary' : 'border-theme-border'
                    }`}
                  >
                    {isSelected && <span className="text-theme-text-on-primary text-xs">✓</span>}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Create group button */}
        {tab === 'group' && (
          <div className="px-4 py-3 border-t border-theme-border">
            <button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selected.length < 2 || creating}
              className="w-full bg-theme-primary text-theme-text-on-primary py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
            >
              {creating ? 'Creating...' : `Create Group${selected.length >= 2 ? ` (${selected.length} members)` : ''}`}
            </button>
            {!groupName.trim() && <p className="text-xs text-red-400 text-center mt-1">Enter a group name to continue</p>}
            {groupName.trim() && selected.length < 2 && <p className="text-xs text-gray-400 text-center mt-1">Select at least 2 members</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default NewChatModal

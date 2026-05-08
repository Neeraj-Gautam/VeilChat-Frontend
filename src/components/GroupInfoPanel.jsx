import { useState } from 'react'
import chatService from '../services/chat.service'
import userService from '../services/user.service'
import useAuthStore from '../store/useAuthStore'
import useChatStore from '../store/useChatStore'
import ProfilePictureModal from './ProfilePictureModal'
import AvatarViewer from './AvatarViewer'

const GroupInfoPanel = ({ onClose }) => {
  const { user } = useAuthStore()
  const { activeChat, setActiveChat, chats, setChats } = useChatStore()
  const [editingName, setEditingName] = useState(false)
  const [groupName, setGroupName] = useState(activeChat?.groupName || '')
  const [addingMembers, setAddingMembers] = useState(false)
  const [searchUsers, setSearchUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(null) // { type: 'remove'|'leave'|'demote', userId, name }
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [avatarViewer, setAvatarViewer] = useState(null)

  if (!activeChat?.isGroupChat) return null

  const ownerId = activeChat.admin?._id || activeChat.admin
  const isOwner = ownerId === user._id || ownerId?.toString() === user._id
  const promotedAdminIds = (activeChat.admins || []).map((a) => a._id || a)
  const isPromotedAdmin = promotedAdminIds.some((id) => id === user._id || id?.toString() === user._id)
  const canManage = isOwner || isPromotedAdmin

  const updateStore = (updatedChat) => {
    setActiveChat(updatedChat)
    setChats(chats.map((c) => (c._id === updatedChat._id ? updatedChat : c)))
  }

  const handleRename = async () => {
    if (!groupName.trim()) return
    try {
      const { data } = await chatService.updateGroup(activeChat._id, { groupName })
      updateStore(data.data)
      setEditingName(false)
    } catch (err) { console.error(err) }
  }

  const handleRemove = async (userId) => {
    try {
      const { data } = await chatService.removeMember(activeChat._id, userId)
      updateStore(data.data)
      setConfirm(null)
    } catch (err) { console.error(err) }
  }

  // Toggle admin — owner promotes/demotes
  const handleToggleAdmin = async (userId) => {
    try {
      const { data } = await chatService.transferAdmin(activeChat._id, userId)
      updateStore(data.data)
      setConfirm(null)
    } catch (err) { console.error(err) }
  }

  const handleLeave = async () => {
    try {
      await chatService.leaveGroup(activeChat._id)
      setChats(chats.filter((c) => c._id !== activeChat._id))
      setActiveChat(null)
      onClose()
      setConfirm(null)
    } catch (err) { console.error(err) }
  }

  const handleSearchUsers = async (val) => {
    setSearch(val)
    if (!val.trim()) { setSearchUsers([]); return }
    setLoading(true)
    try {
      const { data } = await userService.getUsers(val)
      const memberIds = activeChat.participants.map((p) => p._id)
      setSearchUsers(data.data.filter((u) => !memberIds.includes(u._id)))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleAddMember = async (userId) => {
    try {
      const { data } = await chatService.addMembers(activeChat._id, [userId])
      updateStore(data.data)
      setSearch('')
      setSearchUsers([])
    } catch (err) { console.error(err) }
  }

  return (
    <div className="w-80 border-l border-theme-border bg-theme-input-bg flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border">
        <h3 className="text-sm font-semibold text-theme-text-on-other">Group Info</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
      </div>

      {/* Group avatar + name */}
      <div className="flex flex-col items-center py-6 px-4 border-b border-theme-border">
        <div className="relative group">
          <button
            onClick={() => {
              if (activeChat.groupAvatar) {
                setAvatarViewer({ avatar: activeChat.groupAvatar, name: activeChat.groupName })
              }
            }}
            className="w-16 h-16 rounded-full overflow-hidden bg-theme-primary/20 flex items-center justify-center text-2xl font-bold text-theme-primary mb-3 hover:opacity-80 transition cursor-pointer"
          >
            {activeChat.groupAvatar ? (
              <img src={activeChat.groupAvatar} alt={activeChat.groupName} className="w-full h-full object-cover" />
            ) : (
              activeChat.groupName[0]?.toUpperCase()
            )}
          </button>
          {canManage && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowAvatarModal(true)
              }}
              className="absolute bottom-2 right-0 w-6 h-6 bg-theme-primary hover:opacity-80 rounded-full flex items-center justify-center text-theme-text-on-primary text-xs opacity-0 group-hover:opacity-100 transition"
              title="Update group avatar"
            >
              📷
            </button>
          )}
        </div>
        {editingName ? (
          <div className="flex gap-2 w-full">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="flex-1 border border-theme-border bg-theme-input-bg text-theme-text-on-other rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary"
              autoFocus
            />
            <button onClick={handleRename} className="text-xs bg-theme-primary text-theme-text-on-primary px-2 py-1 rounded hover:opacity-90">Save</button>
            <button onClick={() => setEditingName(false)} className="text-xs text-gray-400 px-2 py-1">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-theme-text-on-other">{activeChat.groupName}</p>
            {isOwner && (
              <button onClick={() => setEditingName(true)} className="text-gray-400 hover:text-theme-primary text-xs">✏️</button>
            )}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">{activeChat.participants.length} members</p>
      </div>

      {/* Add members */}
      {canManage && (
        <div className="px-4 py-3 border-b border-theme-border">
          <button
            onClick={() => setAddingMembers(!addingMembers)}
            className="w-full text-sm text-theme-primary font-medium py-1 hover:underline text-left"
          >
            + Add Members
          </button>
          {addingMembers && (
            <div className="mt-2">
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => handleSearchUsers(e.target.value)}
                className="w-full border border-theme-border bg-theme-input-bg text-theme-text-on-other placeholder-gray-400 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary"
              />
              {loading && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
              {searchUsers.map((u) => (
                <div key={u._id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-theme-text-on-other">{u.name}</span>
                  <button onClick={() => handleAddMember(u._id)} className="text-xs bg-theme-primary text-theme-text-on-primary px-2 py-1 rounded hover:opacity-90">Add</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members list */}
      <div className="flex-1 px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">Members</p>
        {activeChat.participants.map((p) => {
          const pid = p._id || p
          const pidStr = pid?.toString()
          const isThisOwner = pidStr === ownerId?.toString()
          const isThisAdmin = promotedAdminIds.some((id) => id?.toString() === pidStr)
          const isMe = pidStr === user._id

          return (
            <div key={pidStr} className="flex items-center justify-between py-2 border-b border-theme-border last:border-0">
              <div className="flex items-center gap-2">
                {p.avatar ? (
                  <button
                    onClick={() => setAvatarViewer({ avatar: p.avatar, name: p.name })}
                    className="w-8 h-8 rounded-full bg-theme-primary/20 flex items-center justify-center overflow-hidden hover:opacity-80 transition cursor-pointer"
                  >
                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-theme-primary/20 flex items-center justify-center text-xs font-semibold text-theme-primary">
                    {p.name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <p className="text-sm text-theme-text-on-other">
                    {p.name || 'Unknown'} {isMe && <span className="text-gray-400 text-xs">(you)</span>}
                  </p>
                  {isThisOwner && <span className="text-xs text-yellow-500 font-medium">Owner</span>}
                  {!isThisOwner && isThisAdmin && <span className="text-xs text-green-500 font-medium">Admin</span>}
                </div>
              </div>

              {/* Owner controls — can promote/demote admins and remove anyone except self */}
              {isOwner && !isMe && !isThisOwner && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setConfirm({ type: isThisAdmin ? 'demote' : 'promote', userId: pidStr, name: p.name })}
                    className={`text-xs px-1.5 py-0.5 rounded text-theme-text-on-primary text-[10px] ${isThisAdmin ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}
                  >
                    {isThisAdmin ? 'Demote' : 'Admin'}
                  </button>
                  <button
                    onClick={() => setConfirm({ type: 'remove', userId: pidStr, name: p.name })}
                    className="text-xs text-red-400 hover:text-red-600 px-1"
                  >✕</button>
                </div>
              )}

              {/* Promoted admin controls — can only remove non-admins */}
              {isPromotedAdmin && !isOwner && !isMe && !isThisOwner && !isThisAdmin && (
                <button
                  onClick={() => setConfirm({ type: 'remove', userId: pidStr, name: p.name })}
                  className="text-xs text-red-400 hover:text-red-600 px-1"
                >✕</button>
              )}
            </div>
          )
        })}
      </div>

      {/* Leave group */}
      <div className="px-4 py-3 border-t border-theme-border">
        <button
          onClick={() => setConfirm({ type: 'leave' })}
          className="w-full text-sm text-red-500 hover:text-red-700 font-medium py-2 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
        >
          Leave Group
        </button>
      </div>

      {/* Confirmation dialog */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-theme-input-bg rounded-xl shadow-xl w-80 mx-4 overflow-hidden border border-theme-border">
            <div className="px-5 py-4">
              <h3 className="text-sm font-semibold text-theme-text-on-other mb-1">
                {confirm.type === 'remove' && `Remove ${confirm.name}?`}
                {confirm.type === 'promote' && `Make ${confirm.name} an admin?`}
                {confirm.type === 'demote' && `Remove ${confirm.name} as admin?`}
                {confirm.type === 'leave' && 'Leave group?'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {confirm.type === 'remove' && `${confirm.name} will no longer be able to send or receive messages in this group.`}
                {confirm.type === 'promote' && `${confirm.name} will be able to add and remove members.`}
                {confirm.type === 'demote' && `${confirm.name} will lose admin privileges.`}
                {confirm.type === 'leave' && 'You will no longer receive messages from this group.'}
              </p>
            </div>
            <div className="flex border-t border-theme-border">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-theme-chat-bg transition-colors"
              >
                Cancel
              </button>
              <div className="w-px bg-theme-border" />
              <button
                onClick={() => {
                  if (confirm.type === 'remove') handleRemove(confirm.userId)
                  else if (confirm.type === 'promote' || confirm.type === 'demote') handleToggleAdmin(confirm.userId)
                  else if (confirm.type === 'leave') handleLeave()
                }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  confirm.type === 'leave' || confirm.type === 'remove'
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
                    : 'text-theme-primary hover:bg-theme-chat-bg'
                }`}
              >
                {confirm.type === 'remove' && 'Remove'}
                {confirm.type === 'promote' && 'Make Admin'}
                {confirm.type === 'demote' && 'Remove Admin'}
                {confirm.type === 'leave' && 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAvatarModal && (
        <ProfilePictureModal
          onClose={() => setShowAvatarModal(false)}
          type="group"
          chat={activeChat}
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

export default GroupInfoPanel

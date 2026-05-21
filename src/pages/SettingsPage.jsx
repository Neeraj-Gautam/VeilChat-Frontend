import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import useThemeStore from '../store/useThemeStore'
import authService from '../services/auth.service'
import userService from '../services/user.service'
import { disconnectSocket } from '../sockets/socket'
import ProfilePictureModal from '../components/ProfilePictureModal'

const SettingsPage = () => {
  const { user, clearAuth } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const navigate = useNavigate()
  
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const bases = [
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬', color: '#25d366' },
    { id: 'telegram', label: 'Telegram', icon: '✈️', color: '#0088cc' },
  ]

  const modes = [
    { id: 'light', label: 'Light', icon: '☀️' },
    { id: 'dark', label: 'Dark', icon: '🌙' },
  ]

  const handleThemeChange = (base, mode) => {
    setTheme(base, mode)
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('Please enter your password')
      return
    }

    setIsDeleting(true)
    setDeleteError('')

    try {
      await userService.deleteAccount(deletePassword)
      disconnectSocket()
      clearAuth()
      navigate('/login')
    } catch (error) {
      setDeleteError(error.response?.data?.message || 'Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
    } finally {
      disconnectSocket()
      clearAuth()
      navigate('/login')
    }
  }

  const currentBase = bases.find(b => b.id === theme.base) || bases[0]
  const currentMode = modes.find(m => m.id === theme.mode) || modes[0]

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-theme-chat-bg w-full">
      {/* Header */}
      <div className="bg-theme-header-bg border-b border-theme-border px-4 sm:px-6 py-4 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate('/')}
            className="touch-target flex items-center justify-center text-theme-text-on-primary hover:opacity-80 transition rounded-lg shrink-0"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M7.28 7.72a.75.75 0 010 1.06l-2.47 2.47H21a.75.75 0 010 1.5H4.81l2.47 2.47a.75.75 0 11-1.06 1.06l-3.75-3.75a.75.75 0 010-1.06l3.75-3.75a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-theme-text-on-primary">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-8">
        {/* Profile Section */}
        <div className="bg-theme-input-bg rounded-xl p-6 mb-4 border border-theme-border">
          <h2 className="text-lg font-semibold text-theme-text-on-other mb-4">Profile</h2>
          
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setShowProfileModal(true)}
              className="relative group"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-theme-primary flex items-center justify-center text-2xl font-bold text-theme-text-on-primary">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                  <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
                  <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3h-15a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0zm12-1.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
              </div>
            </button>
            
            <div>
              <h3 className="text-lg font-semibold text-theme-text-on-other">{user?.name}</h3>
              <p className="text-sm text-theme-text-on-other opacity-60">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => setShowProfileModal(true)}
            className="text-sm text-theme-primary hover:underline"
          >
            Change profile picture
          </button>
        </div>

        {/* Theme Settings */}
        <div className="bg-theme-input-bg rounded-xl p-6 mb-4 border border-theme-border">
          <h2 className="text-lg font-semibold text-theme-text-on-other mb-4">Appearance</h2>
          
          {/* App Style */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-theme-text-on-other mb-3">App Style</h3>
            <div className="grid grid-cols-2 gap-3">
              {bases.map(({ id, label, icon, color }) => (
                <button
                  key={id}
                  onClick={() => handleThemeChange(id, theme.mode)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme.base === id
                      ? 'border-theme-primary bg-theme-primary/10'
                      : 'border-theme-border hover:border-theme-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{icon}</span>
                    <div className="text-left">
                      <div className="font-medium text-theme-text-on-other">{label}</div>
                      <div className="text-xs text-theme-text-on-other opacity-60" style={{ color }}>
                        {id === 'whatsapp' ? 'Green theme' : 'Blue theme'}
                      </div>
                    </div>
                    {theme.base === id && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-theme-primary ml-auto">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Mode */}
          <div>
            <h3 className="text-sm font-medium text-theme-text-on-other mb-3">Theme Mode</h3>
            <div className="grid grid-cols-2 gap-3">
              {modes.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => handleThemeChange(theme.base, id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme.mode === id
                      ? 'border-theme-primary bg-theme-primary/10'
                      : 'border-theme-border hover:border-theme-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{icon}</span>
                    <div className="text-left">
                      <div className="font-medium text-theme-text-on-other">{label}</div>
                    </div>
                    {theme.mode === id && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-theme-primary ml-auto">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications (Placeholder) */}
        <div className="bg-theme-input-bg rounded-xl p-6 mb-4 border border-theme-border">
          <h2 className="text-lg font-semibold text-theme-text-on-other mb-4">Notifications</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-theme-text-on-other">Message notifications</div>
                <div className="text-sm text-theme-text-on-other opacity-60">Show notifications for new messages</div>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-theme-text-on-other">Sound</div>
                <div className="text-sm text-theme-text-on-other opacity-60">Play sound for notifications</div>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Privacy (Placeholder) */}
        <div className="bg-theme-input-bg rounded-xl p-6 mb-4 border border-theme-border">
          <h2 className="text-lg font-semibold text-theme-text-on-other mb-4">Privacy</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-theme-text-on-other">Read receipts</div>
                <div className="text-sm text-theme-text-on-other opacity-60">Show when you've read messages</div>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-theme-text-on-other">Online status</div>
                <div className="text-sm text-theme-text-on-other opacity-60">Show when you're online</div>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-theme-text-on-other">Typing indicator</div>
                <div className="text-sm text-theme-text-on-other opacity-60">Show when you're typing</div>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-theme-input-bg rounded-xl p-6 mb-4 border border-theme-border">
          <h2 className="text-lg font-semibold text-theme-text-on-other mb-4">Account</h2>
          
          <button
            onClick={handleLogout}
            className="w-full p-3 mb-3 rounded-lg bg-theme-primary text-theme-text-on-primary hover:opacity-90 transition font-medium"
          >
            Logout
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full p-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition font-medium"
          >
            Delete Account
          </button>
        </div>

        {/* About */}
        <div className="bg-theme-input-bg rounded-xl p-6 border border-theme-border">
          <h2 className="text-lg font-semibold text-theme-text-on-other mb-4">About</h2>
          <div className="space-y-2 text-sm text-theme-text-on-other opacity-60">
            <p>VeilChat v1.0.0</p>
            <p>A modern real-time chat application</p>
            <p className="pt-2">
              <a href="https://github.com/yourusername/veilchat" target="_blank" rel="noopener noreferrer" className="text-theme-primary hover:underline">
                View on GitHub
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-input-bg rounded-xl p-6 max-w-md w-full border border-theme-border">
            <h3 className="text-xl font-semibold text-red-500 mb-4">Delete Account</h3>
            
            <div className="mb-4">
              <p className="text-theme-text-on-other mb-2">
                This action cannot be undone. All your data will be permanently deleted:
              </p>
              <ul className="list-disc list-inside text-sm text-theme-text-on-other opacity-80 space-y-1">
                <li>Your profile and messages</li>
                <li>All your chats and groups</li>
                <li>Your uploaded files</li>
              </ul>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-text-on-other mb-2">
                Enter your password to confirm:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-theme-chat-bg text-theme-text-on-other border border-theme-border focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Your password"
              />
              {deleteError && (
                <p className="text-red-500 text-sm mt-2">{deleteError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeletePassword('')
                  setDeleteError('')
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg bg-theme-border text-theme-text-on-other hover:opacity-80 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50 font-medium"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Picture Modal */}
      {showProfileModal && (
        <ProfilePictureModal
          onClose={() => setShowProfileModal(false)}
          type="user"
        />
      )}
    </div>
  )
}

export default SettingsPage

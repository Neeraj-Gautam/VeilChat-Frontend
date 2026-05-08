import { Link, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import useAuthStore from '../store/useAuthStore'
import useThemeStore from '../store/useThemeStore'
import authService from '../services/auth.service'
import { disconnectSocket } from '../sockets/socket'
import ProfilePictureModal from './ProfilePictureModal'

const Navbar = () => {
  const { user, clearAuth } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const navigate = useNavigate()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [activeTab, setActiveTab] = useState('base') // 'base' or 'mode'
  const themeMenuRef = useRef(null)

  const bases = [
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { id: 'telegram', label: 'Telegram', icon: '✈️' },
  ]

  const modes = [
    { id: 'light', label: 'Light', icon: '☀️' },
    { id: 'dark', label: 'Dark', icon: '🌙' },
  ]

  // Close theme menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemeMenu(false)
        setActiveTab('base')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleThemeSelect = (base, mode) => {
    setTheme(base, mode)
    setShowThemeMenu(false)
    setActiveTab('base')
  }

  const currentBase = bases.find(b => b.id === theme.base) || bases[0]
  const currentMode = modes.find(m => m.id === theme.mode) || modes[0]

  const handleLogout = async () => {
    try { await authService.logout() } finally {
      disconnectSocket()
      clearAuth()
      navigate('/login')
    }
  }

  return (
    <>
      <nav className="flex items-center justify-between px-3 md:px-6 py-3 bg-theme-header-bg border-b border-theme-border">
        <Link to="/" className="text-base md:text-lg font-semibold text-theme-text-on-primary truncate">
          VeilChat
        </Link>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Settings Link */}
          {user && (
            <Link
              to="/settings"
              className="text-theme-text-on-primary opacity-70 hover:opacity-100 transition-opacity"
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
              </svg>
            </Link>
          )}
          
          {/* Theme selector dropdown */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => { setShowThemeMenu(!showThemeMenu); setActiveTab('base') }}
              className="text-theme-text-on-primary opacity-70 hover:opacity-100 text-lg transition-opacity flex items-center gap-1"
              aria-label="Select theme"
              aria-expanded={showThemeMenu}
              aria-haspopup="true"
            >
              {currentBase.icon}
              <span className="text-xs">▼</span>
            </button>
            
            {showThemeMenu && (
              <div className="absolute right-0 mt-2 py-2 w-56 bg-theme-input-bg border border-theme-border rounded-lg shadow-lg z-50">
                {/* Tab buttons */}
                <div className="flex border-b border-theme-border mx-2 mb-2">
                  <button
                    onClick={() => setActiveTab('base')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-t-md transition-colors ${
                      activeTab === 'base' 
                        ? 'bg-theme-primary text-theme-text-on-primary' 
                        : 'text-theme-text-on-other hover:bg-theme-border'
                    }`}
                  >
                    App Style
                  </button>
                  <button
                    onClick={() => setActiveTab('mode')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-t-md transition-colors ${
                      activeTab === 'mode' 
                        ? 'bg-theme-primary text-theme-text-on-primary' 
                        : 'text-theme-text-on-other hover:bg-theme-border'
                    }`}
                  >
                    Theme
                  </button>
                </div>

                {/* Current selection display */}
                <div className="px-3 pb-2">
                  <div className="flex items-center justify-between text-xs text-theme-text-on-other opacity-70">
                    <span>Current: {currentBase.icon} {currentBase.label} + {currentMode.icon} {currentMode.label}</span>
                  </div>
                </div>

                {/* Options based on active tab */}
                {activeTab === 'base' ? (
                  bases.map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => handleThemeSelect(id, theme.mode)}
                      className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors ${
                        theme.base === id
                          ? 'bg-theme-primary text-theme-text-on-primary'
                          : 'text-theme-text-on-other hover:bg-theme-primary hover:text-theme-text-on-primary'
                      }`}
                      aria-label={`Select ${label} style`}
                      aria-pressed={theme.base === id}
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                      {theme.base === id && <span className="ml-auto">✓</span>}
                    </button>
                  ))
                ) : (
                  modes.map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => handleThemeSelect(theme.base, id)}
                      className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors ${
                        theme.mode === id
                          ? 'bg-theme-primary text-theme-text-on-primary'
                          : 'text-theme-text-on-other hover:bg-theme-primary hover:text-theme-text-on-primary'
                      }`}
                      aria-label={`Select ${label} theme`}
                      aria-pressed={theme.mode === id}
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                      {theme.mode === id && <span className="ml-auto">✓</span>}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {user && (
            <>
              {/* Profile Picture */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-8 h-8 rounded-full overflow-hidden bg-theme-input-bg hover:ring-2 hover:ring-theme-primary transition"
                title="Update profile picture"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-medium text-theme-text-on-other">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </button>
              <span className="text-sm text-theme-text-on-primary opacity-80">{user.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-700 dark:text-red-400"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      {showProfileModal && (
        <ProfilePictureModal
          onClose={() => setShowProfileModal(false)}
          type="user"
        />
      )}
    </>
  )
}

export default Navbar
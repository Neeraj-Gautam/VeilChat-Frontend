import useThemeStore from '../store/useThemeStore'

const ThemeSelector = () => {
  const { theme, setTheme } = useThemeStore()

  const themes = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'telegram', label: 'Telegram' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {themes.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => setTheme(id)}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${
              theme === id
                ? 'bg-theme-primary text-theme-text-on-primary shadow-md'
                : 'bg-theme-input-bg text-theme-text-on-other border border-theme-border hover:bg-theme-primary hover:text-theme-text-on-primary hover:border-transparent'
            }
          `}
          aria-label={`Switch to ${label} theme`}
          aria-pressed={theme === id}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default ThemeSelector

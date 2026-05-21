import { create } from 'zustand'

// Theme configuration
const VALID_BASES = ['whatsapp', 'telegram']
const VALID_MODES = ['light', 'dark']

/** Legacy single-token themes (tests + older callers) */
const LEGACY_THEME_MAP = {
  light: { base: 'whatsapp', mode: 'light' },
  dark: { base: 'whatsapp', mode: 'dark' },
  whatsapp: { base: 'whatsapp', mode: 'light' },
  telegram: { base: 'telegram', mode: 'light' },
}

const resolveThemeArgs = (arg1, arg2) => {
  if (arg2 !== undefined) {
    if (VALID_BASES.includes(arg1) && VALID_MODES.includes(arg2)) {
      return { base: arg1, mode: arg2 }
    }
    return null
  }
  if (typeof arg1 !== 'string' || arg1.trim() === '') return null

  if (arg1.includes('-')) {
    const [base, mode] = arg1.split('-')
    if (VALID_BASES.includes(base) && VALID_MODES.includes(mode)) {
      return { base, mode }
    }
    return null
  }

  if (Object.hasOwn(LEGACY_THEME_MAP, arg1)) {
    return LEGACY_THEME_MAP[arg1]
  }

  return null
}

// Check if browser supports CSS custom properties
const checkCSSCustomPropertySupport = () => {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    return false
  }
  return CSS.supports('--test', 'value')
}

// Detect CSS custom property support and handle fallback
const initializeCSSSupport = () => {
  const supportsCSSVars = checkCSSCustomPropertySupport()
  
  if (!supportsCSSVars) {
    console.warn(
      'Your browser does not support CSS custom properties (CSS variables). ' +
      'The theme system will fall back to static colors. ' +
      'For the best experience, please upgrade to a modern browser ' +
      '(Chrome 88+, Firefox 85+, Safari 14+, or later).'
    )
    document.documentElement.setAttribute('data-css-vars', 'unsupported')
  } else {
    document.documentElement.setAttribute('data-css-vars', 'supported')
  }
  
  return supportsCSSVars
}

// Initialize CSS support detection
const cssVarsSupported = initializeCSSSupport()

// Export for components to check fallback mode
export const isCSSVarsSupported = () => cssVarsSupported

// Initialize theme from localStorage with validation
const initializeTheme = () => {
  try {
    const stored = localStorage.getItem('theme')
    
    // Handle new combined format (base + mode)
    if (stored && stored.includes('-')) {
      const [base, mode] = stored.split('-')
      if (VALID_BASES.includes(base) && VALID_MODES.includes(mode)) {
        return { base, mode }
      }
    }
    
    // Handle legacy format (old single theme)
    if (stored === 'light') return { base: 'whatsapp', mode: 'light' }
    if (stored === 'dark') return { base: 'whatsapp', mode: 'dark' }
    if (stored === 'whatsapp') return { base: 'whatsapp', mode: 'light' }
    if (stored === 'telegram') return { base: 'telegram', mode: 'light' }
    
    // Clear corrupted data if invalid
    if (stored !== null) {
      console.warn(`Invalid theme value "${stored}" found in localStorage. Resetting to default.`)
      localStorage.removeItem('theme')
    }
    
    // Default to WhatsApp + Light
    return { base: 'whatsapp', mode: 'light' }
  } catch (error) {
    console.warn('localStorage unavailable. Theme will not persist across sessions.', error)
    return { base: 'whatsapp', mode: 'light' }
  }
}

// Get initial theme
const initialTheme = initializeTheme()

const applyThemeToDocument = (base, mode) => {
  const themeString = `${base}-${mode}`
  document.documentElement.setAttribute('data-theme', themeString)
  document.documentElement.classList.toggle('dark', mode === 'dark')
}

// Set data-theme attribute synchronously before first paint
applyThemeToDocument(initialTheme.base, initialTheme.mode)

const useThemeStore = create((set) => ({
  theme: initialTheme,

  setTheme: (baseOrLegacy, mode) => {
    const resolved = resolveThemeArgs(baseOrLegacy, mode)
    if (!resolved) {
      const label = mode !== undefined ? `${baseOrLegacy}-${mode}` : String(baseOrLegacy)
      console.warn(
        `Invalid theme "${label}". Valid bases: ${VALID_BASES.join(', ')}, modes: ${VALID_MODES.join(', ')} ` +
        `(legacy: light, dark, whatsapp, telegram)`
      )
      return
    }

    const { base, mode: resolvedMode } = resolved
    const themeString = `${base}-${resolvedMode}`

    applyThemeToDocument(base, resolvedMode)
    
    // Persist to localStorage with error handling
    try {
      localStorage.setItem('theme', themeString)
    } catch (error) {
      console.warn('Failed to persist theme to localStorage.', error)
    }
    
    // Update Zustand state
    set({ theme: { base, mode: resolvedMode } })
  },
}))

export default useThemeStore

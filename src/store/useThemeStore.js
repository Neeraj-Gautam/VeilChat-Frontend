import { create } from 'zustand'

// Theme configuration
const VALID_BASES = ['whatsapp', 'telegram']
const VALID_MODES = ['light', 'dark']

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

// Set data-theme attribute synchronously before first paint
document.documentElement.setAttribute('data-theme', `${initialTheme.base}-${initialTheme.mode}`)

const useThemeStore = create((set) => ({
  theme: initialTheme,

  setTheme: (base, mode) => {
    // Validate theme against whitelist
    if (!VALID_BASES.includes(base) || !VALID_MODES.includes(mode)) {
      console.warn(`Invalid theme "${base}-${mode}". Valid bases: ${VALID_BASES.join(', ')}, modes: ${VALID_MODES.join(', ')}`)
      return
    }

    const themeString = `${base}-${mode}`
    
    // Update DOM data-theme attribute
    document.documentElement.setAttribute('data-theme', themeString)
    
    // Persist to localStorage with error handling
    try {
      localStorage.setItem('theme', themeString)
    } catch (error) {
      console.warn('Failed to persist theme to localStorage.', error)
    }
    
    // Update Zustand state
    set({ theme: { base, mode } })
  },
}))

export default useThemeStore

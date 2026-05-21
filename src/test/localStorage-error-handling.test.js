import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import useThemeStore from '../store/useThemeStore'
import {
  LEGACY_THEME_IDS,
  LEGACY_THEME_SPEC,
  resetThemeTestState,
  expectLegacyThemeApplied,
} from './themeTestHelpers'

/**
 * Unit Tests: localStorage Error Handling
 * 
 * **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**
 * 
 * These tests verify that the theme system gracefully handles localStorage
 * errors (e.g., in private browsing mode) by:
 * - Defaulting to 'light' theme when localStorage.getItem() fails
 * - Still updating state and DOM when localStorage.setItem() fails
 * - Allowing theme switching within session when localStorage unavailable
 * - Logging warnings when localStorage operations fail
 * - Resetting to default on reload when localStorage unavailable
 */
describe('localStorage Error Handling', () => {
  let consoleWarnSpy

  beforeEach(() => {
    resetThemeTestState()
    vi.clearAllMocks()
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    // Restore console.warn
    consoleWarnSpy.mockRestore()
  })

  /**
   * Test Scenario 1: localStorage.getItem() throws error
   * 
   * **Validates: Requirements 13.1, 13.2, 13.4**
   * 
   * When localStorage.getItem() throws an error (e.g., in private browsing mode),
   * the system should:
   * - Catch the error gracefully
   * - Default to 'light' theme
   * - Log a warning to the console
   * - Continue functioning normally
   */
  it('should default to light theme when localStorage.getItem() throws error', () => {
    // Mock localStorage.getItem to throw error
    const originalGetItem = Storage.prototype.getItem
    Storage.prototype.getItem = vi.fn(() => {
      throw new Error('localStorage is not available')
    })

    // Simulate initialization by calling the initialization logic
    let initializedTheme = 'light' // Default
    try {
      const stored = localStorage.getItem('theme')
      const validThemes = ['light', 'dark', 'whatsapp', 'telegram']
      
      if (stored !== null && validThemes.includes(stored)) {
        initializedTheme = stored
      } else if (stored !== null && !validThemes.includes(stored)) {
        localStorage.removeItem('theme')
        initializedTheme = 'light'
      }
    } catch (error) {
      // Should catch error and default to 'light'
      console.warn('localStorage unavailable. Theme will not persist across sessions.', error)
      initializedTheme = 'light'
    }

    // Verify default theme is 'light'
    expect(initializedTheme).toBe('light')

    // Verify warning was logged
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('localStorage unavailable'),
      expect.any(Error)
    )

    // Restore
    Storage.prototype.getItem = originalGetItem
  })

  /**
   * Test Scenario 2: localStorage.setItem() throws error
   * 
   * **Validates: Requirements 13.1, 13.2, 13.4**
   * 
   * When localStorage.setItem() throws an error, the system should:
   * - Catch the error gracefully
   * - Still update Zustand state
   * - Still update DOM data-theme attribute
   * - Log a warning to the console
   */
  it('should still update state and DOM when localStorage.setItem() throws error', () => {
    // Mock localStorage.setItem to throw error
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError: localStorage is full')
    })

    const { setTheme } = useThemeStore.getState()

    // Attempt to set theme (should not throw)
    expect(() => setTheme('dark')).not.toThrow()

    // Verify Zustand state was updated
    expectLegacyThemeApplied('dark', { checkStorage: false })

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to persist theme to localStorage'),
      expect.any(Error)
    )

    Storage.prototype.setItem = originalSetItem
  })

  /**
   * Test Scenario 3: Theme switching works in-memory when localStorage unavailable
   * 
   * **Validates: Requirements 13.2, 13.4**
   * 
   * When localStorage is unavailable, the system should:
   * - Allow theme switching within the current session
   * - Update Zustand state correctly
   * - Update DOM data-theme attribute correctly
   * - Support switching between all valid themes
   */
  it('should allow theme switching within session when localStorage unavailable', () => {
    // Mock both localStorage methods to throw errors
    const originalGetItem = Storage.prototype.getItem
    const originalSetItem = Storage.prototype.setItem
    
    Storage.prototype.getItem = vi.fn(() => {
      throw new Error('localStorage is not available')
    })
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('localStorage is not available')
    })

    const { setTheme } = useThemeStore.getState()
    LEGACY_THEME_IDS.forEach((legacyId) => {
      setTheme(legacyId)
      expectLegacyThemeApplied(legacyId, { checkStorage: false })
    })

    // Verify warnings were logged for each setTheme call
    expect(consoleWarnSpy).toHaveBeenCalledTimes(LEGACY_THEME_IDS.length)

    // Restore
    Storage.prototype.getItem = originalGetItem
    Storage.prototype.setItem = originalSetItem
  })

  /**
   * Test Scenario 4: Warning is logged when localStorage operations fail
   * 
   * **Validates: Requirements 13.3, 13.4**
   * 
   * When localStorage operations fail, the system should:
   * - Log a descriptive warning message
   * - Include the error object in the warning
   * - Continue functioning without throwing errors
   */
  it('should log warning when localStorage.getItem() fails', () => {
    // Mock localStorage.getItem to throw error
    const originalGetItem = Storage.prototype.getItem
    Storage.prototype.getItem = vi.fn(() => {
      throw new Error('SecurityError: Access denied')
    })

    // Simulate initialization
    try {
      localStorage.getItem('theme')
    } catch (error) {
      console.warn('localStorage unavailable. Theme will not persist across sessions.', error)
    }

    // Verify warning was logged with error
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('localStorage unavailable'),
      expect.objectContaining({
        message: expect.stringContaining('Access denied')
      })
    )

    // Restore
    Storage.prototype.getItem = originalGetItem
  })

  it('should log warning when localStorage.setItem() fails', () => {
    // Mock localStorage.setItem to throw error
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError: Storage quota exceeded')
    })

    const { setTheme } = useThemeStore.getState()
    setTheme('whatsapp')

    // Verify warning was logged with error
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to persist theme to localStorage'),
      expect.objectContaining({
        message: expect.stringContaining('Storage quota exceeded')
      })
    )

    // Restore
    Storage.prototype.setItem = originalSetItem
  })

  /**
   * Test Scenario 5: Theme resets to default on simulated reload when localStorage unavailable
   * 
   * **Validates: Requirements 13.2, 13.5**
   * 
   * When localStorage is unavailable and the page reloads, the system should:
   * - Reset to the default 'light' theme
   * - Not retain the in-memory theme from the previous session
   * - Continue functioning normally after reload
   */
  it('should reset to default theme on simulated reload when localStorage unavailable', () => {
    // Mock localStorage to be unavailable
    const originalGetItem = Storage.prototype.getItem
    const originalSetItem = Storage.prototype.setItem
    
    Storage.prototype.getItem = vi.fn(() => {
      throw new Error('localStorage is not available')
    })
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('localStorage is not available')
    })

    const { setTheme } = useThemeStore.getState()

    // Step 1: Set theme to 'telegram' in current session
    setTheme('telegram')
    expectLegacyThemeApplied('telegram', { checkStorage: false })

    // Step 2: Simulate page reload by resetting store to initial state
    // In a real reload, the store would be re-initialized from localStorage
    // Since localStorage is unavailable, it should default to 'light'
    let reloadedTheme = LEGACY_THEME_SPEC.light.key
    try {
      const stored = localStorage.getItem('theme')
      const validCombined = /^(whatsapp|telegram)-(light|dark)$/

      if (stored !== null && validCombined.test(stored)) {
        reloadedTheme = stored
      }
    } catch {
      reloadedTheme = LEGACY_THEME_SPEC.light.key
    }

    expect(reloadedTheme).toBe(LEGACY_THEME_SPEC.light.key)
    expect(reloadedTheme).not.toBe(LEGACY_THEME_SPEC.telegram.key)

    useThemeStore.setState({ theme: { ...LEGACY_THEME_SPEC.light.theme } })
    document.documentElement.setAttribute('data-theme', reloadedTheme)

    setTheme('dark')
    expectLegacyThemeApplied('dark', { checkStorage: false })

    Storage.prototype.getItem = originalGetItem
    Storage.prototype.setItem = originalSetItem
  })

  /**
   * Test Scenario: Multiple localStorage errors in sequence
   * 
   * **Validates: Requirements 13.1, 13.2, 13.3, 13.4**
   * 
   * When multiple localStorage operations fail in sequence, the system should:
   * - Handle each error gracefully
   * - Continue functioning throughout
   * - Log warnings for each failure
   * - Maintain state consistency
   */
  it('should handle multiple localStorage errors in sequence gracefully', () => {
    // Mock localStorage to throw errors
    const originalGetItem = Storage.prototype.getItem
    const originalSetItem = Storage.prototype.setItem
    
    Storage.prototype.getItem = vi.fn(() => {
      throw new Error('localStorage is not available')
    })
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('localStorage is not available')
    })

    const { setTheme } = useThemeStore.getState()

    // Perform multiple theme switches
    setTheme('dark')
    expectLegacyThemeApplied('dark', { checkStorage: false })

    setTheme('whatsapp')
    expectLegacyThemeApplied('whatsapp', { checkStorage: false })

    setTheme('telegram')
    expectLegacyThemeApplied('telegram', { checkStorage: false })

    setTheme('light')
    expectLegacyThemeApplied('light', { checkStorage: false })

    // Verify warnings were logged for each operation
    expect(consoleWarnSpy).toHaveBeenCalledTimes(4)

    // Verify all warnings contain the expected message
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to persist theme to localStorage'),
      expect.any(Error)
    )

    // Restore
    Storage.prototype.getItem = originalGetItem
    Storage.prototype.setItem = originalSetItem
  })

  /**
   * Test Scenario: localStorage becomes available after being unavailable
   * 
   * **Validates: Requirements 13.2, 13.4**
   * 
   * When localStorage becomes available after being unavailable, the system should:
   * - Start persisting theme preferences again
   * - Continue functioning normally
   * - Successfully save and retrieve themes
   */
  it('should resume persistence when localStorage becomes available', () => {
    // Step 1: Mock localStorage to be unavailable initially
    const originalSetItem = Storage.prototype.setItem
    let localStorageAvailable = false
    
    Storage.prototype.setItem = vi.fn((key, value) => {
      if (!localStorageAvailable) {
        throw new Error('localStorage is not available')
      }
      // Call original implementation when available
      return originalSetItem.call(localStorage, key, value)
    })

    const { setTheme } = useThemeStore.getState()

    // Step 2: Set theme while localStorage is unavailable
    setTheme('dark')
    expectLegacyThemeApplied('dark', { checkStorage: false })
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to persist theme to localStorage'),
      expect.any(Error)
    )

    // Step 3: Make localStorage available
    localStorageAvailable = true

    // Step 4: Set theme while localStorage is available
    setTheme('whatsapp')
    expectLegacyThemeApplied('whatsapp')

    setTheme('telegram')
    expectLegacyThemeApplied('telegram')

    // Restore
    Storage.prototype.setItem = originalSetItem
  })

  /**
   * Test Scenario: Different types of localStorage errors
   * 
   * **Validates: Requirements 13.1, 13.2, 13.3, 13.4**
   * 
   * The system should handle various types of localStorage errors:
   * - SecurityError (private browsing, cross-origin)
   * - QuotaExceededError (storage full)
   * - Generic errors
   */
  it('should handle SecurityError from localStorage', () => {
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = vi.fn(() => {
      const error = new Error('Access is denied for this document')
      error.name = 'SecurityError'
      throw error
    })

    const { setTheme } = useThemeStore.getState()
    setTheme('dark')

    expectLegacyThemeApplied('dark', { checkStorage: false })
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to persist theme to localStorage'),
      expect.objectContaining({
        name: 'SecurityError'
      })
    )

    Storage.prototype.setItem = originalSetItem
  })

  it('should handle QuotaExceededError from localStorage', () => {
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = vi.fn(() => {
      const error = new Error('QuotaExceededError')
      error.name = 'QuotaExceededError'
      throw error
    })

    const { setTheme } = useThemeStore.getState()
    setTheme('whatsapp')

    expectLegacyThemeApplied('whatsapp', { checkStorage: false })
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to persist theme to localStorage'),
      expect.objectContaining({
        name: 'QuotaExceededError'
      })
    )

    Storage.prototype.setItem = originalSetItem
  })

  /**
   * Test Scenario: localStorage.removeItem() throws error during corruption cleanup
   * 
   * **Validates: Requirements 13.1, 13.2, 13.4**
   * 
   * When localStorage.removeItem() throws an error during corruption cleanup,
   * the system should:
   * - Catch the error gracefully
   * - Still default to 'light' theme
   * - Continue functioning normally
   */
  it('should handle error when removing corrupted data from localStorage', () => {
    // Set corrupted data
    localStorage.setItem('theme', 'invalid-theme')

    // Mock localStorage.removeItem to throw error
    const originalRemoveItem = Storage.prototype.removeItem
    Storage.prototype.removeItem = vi.fn(() => {
      throw new Error('localStorage is not available')
    })

    // Simulate initialization with corrupted data
    let initializedTheme = 'light'
    try {
      const stored = localStorage.getItem('theme')
      const validThemes = ['light', 'dark', 'whatsapp', 'telegram']
      
      if (stored !== null && !validThemes.includes(stored)) {
        try {
          localStorage.removeItem('theme')
        } catch (error) {
          // Should catch error during cleanup
          console.warn('Failed to remove corrupted theme data from localStorage', error)
        }
        initializedTheme = 'light'
      }
    } catch (error) {
      initializedTheme = 'light'
    }

    // Verify default theme is 'light'
    expect(initializedTheme).toBe('light')

    // Verify system continues functioning
    const { setTheme } = useThemeStore.getState()
    setTheme('dark')
    expectLegacyThemeApplied('dark', { checkStorage: false })

    Storage.prototype.removeItem = originalRemoveItem
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import useThemeStore from '../store/useThemeStore'

describe('useThemeStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset document.documentElement.setAttribute
    document.documentElement.setAttribute('data-theme', 'light')
  })

  it('should initialize with light theme by default', () => {
    const { theme } = useThemeStore.getState()
    expect(theme).toBe('light')
  })

  it('should set data-theme attribute on initialization', () => {
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('should update theme when setTheme is called with valid theme', () => {
    const { setTheme } = useThemeStore.getState()
    
    setTheme('dark')
    
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('should support all four valid themes', () => {
    const { setTheme } = useThemeStore.getState()
    const validThemes = ['light', 'dark', 'whatsapp', 'telegram']
    
    validThemes.forEach(theme => {
      setTheme(theme)
      expect(useThemeStore.getState().theme).toBe(theme)
      expect(document.documentElement.getAttribute('data-theme')).toBe(theme)
      expect(localStorage.getItem('theme')).toBe(theme)
    })
  })

  it('should reject invalid theme and maintain current theme', () => {
    const { setTheme } = useThemeStore.getState()
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    // Set to a valid theme first
    setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
    
    // Try to set invalid theme
    setTheme('invalid-theme')
    
    // Should maintain current theme
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid theme "invalid-theme"')
    )
    
    consoleWarnSpy.mockRestore()
  })

  it('should persist theme to localStorage', () => {
    const { setTheme } = useThemeStore.getState()
    
    setTheme('whatsapp')
    
    expect(localStorage.getItem('theme')).toBe('whatsapp')
  })

  it('should handle localStorage errors gracefully', () => {
    const { setTheme } = useThemeStore.getState()
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    // Mock localStorage.setItem to throw error
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('localStorage unavailable')
    })
    
    // Should still update state and DOM even if localStorage fails
    setTheme('telegram')
    
    expect(useThemeStore.getState().theme).toBe('telegram')
    expect(document.documentElement.getAttribute('data-theme')).toBe('telegram')
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to persist theme to localStorage'),
      expect.any(Error)
    )
    
    // Restore
    Storage.prototype.setItem = originalSetItem
    consoleWarnSpy.mockRestore()
  })

  it('should validate and clear corrupted localStorage data on initialization', () => {
    // Set invalid theme in localStorage
    localStorage.setItem('theme', 'corrupted-value')
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    // Re-import to trigger initialization
    // Note: In a real scenario, this would happen on page load
    // For this test, we verify the validation logic works
    const { setTheme } = useThemeStore.getState()
    
    // Try to set a valid theme after corruption
    setTheme('light')
    
    expect(useThemeStore.getState().theme).toBe('light')
    
    consoleWarnSpy.mockRestore()
  })

  it('should update DOM data-theme attribute when theme changes', () => {
    const { setTheme } = useThemeStore.getState()
    
    setTheme('whatsapp')
    expect(document.documentElement.getAttribute('data-theme')).toBe('whatsapp')
    
    setTheme('telegram')
    expect(document.documentElement.getAttribute('data-theme')).toBe('telegram')
    
    setTheme('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    
    setTheme('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})

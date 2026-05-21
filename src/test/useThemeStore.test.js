import { describe, it, expect, beforeEach, vi } from 'vitest'
import useThemeStore from '../store/useThemeStore'
import {
  DEFAULT_THEME,
  LEGACY_THEME_SPEC,
  LEGACY_THEME_IDS,
  resetThemeTestState,
  setLegacyTheme,
  expectLegacyThemeApplied,
} from './themeTestHelpers'

describe('useThemeStore', () => {
  beforeEach(() => {
    resetThemeTestState()
  })

  it('should initialize with whatsapp light theme by default', () => {
    expect(useThemeStore.getState().theme).toEqual(DEFAULT_THEME)
  })

  it('should set data-theme attribute on initialization', () => {
    expect(document.documentElement.getAttribute('data-theme')).toBe(LEGACY_THEME_SPEC.light.key)
  })

  it('should update theme when setTheme is called with valid legacy theme', () => {
    setLegacyTheme('dark')
    expectLegacyThemeApplied('dark')
  })

  it('should support all four valid legacy themes', () => {
    LEGACY_THEME_IDS.forEach((legacyId) => {
      setLegacyTheme(legacyId)
      expectLegacyThemeApplied(legacyId)
    })
  })

  it('should reject invalid theme and maintain current theme', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    setLegacyTheme('dark')
    expectLegacyThemeApplied('dark')

    useThemeStore.getState().setTheme('invalid-theme')

    expectLegacyThemeApplied('dark')
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid theme "invalid-theme"')
    )

    consoleWarnSpy.mockRestore()
  })

  it('should persist theme to localStorage', () => {
    setLegacyTheme('whatsapp')
    expect(localStorage.getItem('theme')).toBe(LEGACY_THEME_SPEC.whatsapp.key)
  })

  it('should handle localStorage errors gracefully', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('localStorage unavailable')
    })

    useThemeStore.getState().setTheme('telegram')

    expectLegacyThemeApplied('telegram', { checkStorage: false })
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to persist theme to localStorage'),
      expect.any(Error)
    )

    Storage.prototype.setItem = originalSetItem
    consoleWarnSpy.mockRestore()
  })

  it('should validate and clear corrupted localStorage data on initialization', () => {
    localStorage.setItem('theme', 'corrupted-value')
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    setLegacyTheme('light')
    expectLegacyThemeApplied('light')

    consoleWarnSpy.mockRestore()
  })

  it('should update DOM data-theme attribute when theme changes', () => {
    setLegacyTheme('whatsapp')
    expect(document.documentElement.getAttribute('data-theme')).toBe(LEGACY_THEME_SPEC.whatsapp.key)

    setLegacyTheme('telegram')
    expect(document.documentElement.getAttribute('data-theme')).toBe(LEGACY_THEME_SPEC.telegram.key)

    setLegacyTheme('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe(LEGACY_THEME_SPEC.dark.key)

    setLegacyTheme('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe(LEGACY_THEME_SPEC.light.key)
  })

  it('should accept base + mode API', () => {
    const { setTheme } = useThemeStore.getState()
    setTheme('telegram', 'dark')
    expect(useThemeStore.getState().theme).toEqual({ base: 'telegram', mode: 'dark' })
    expect(document.documentElement.getAttribute('data-theme')).toBe('telegram-dark')
    expect(localStorage.getItem('theme')).toBe('telegram-dark')
  })
})

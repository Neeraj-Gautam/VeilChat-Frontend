import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import useThemeStore from '../store/useThemeStore'
import {
  LEGACY_THEME_IDS,
  LEGACY_THEME_SPEC,
  resetThemeTestState,
} from './themeTestHelpers'

describe('Property Test: Invalid Theme Rejection', () => {
  beforeEach(() => {
    resetThemeTestState()
    vi.clearAllMocks()
  })

  const isInvalidThemeString = (s) =>
    s.trim().length > 0 &&
    !LEGACY_THEME_IDS.includes(s) &&
    !/^(whatsapp|telegram)-(light|dark)$/.test(s)

  const themeSnapshot = (legacyId) => {
    const spec = LEGACY_THEME_SPEC[legacyId]
    return {
      zustand: JSON.stringify(useThemeStore.getState().theme),
      dom: document.documentElement.getAttribute('data-theme'),
      storage: localStorage.getItem('theme'),
      spec: JSON.stringify(spec.theme),
      key: spec.key,
    }
  }

  it('should reject invalid theme values, log warning, and maintain current theme', () => {
    const invalidThemeArbitrary = fc.string({ minLength: 1 }).filter(isInvalidThemeString)
    const validThemeArbitrary = fc.constantFrom(...LEGACY_THEME_IDS)

    fc.assert(
      fc.property(validThemeArbitrary, invalidThemeArbitrary, (initialTheme, invalidTheme) => {
        resetThemeTestState()
        const { setTheme } = useThemeStore.getState()
        setTheme(initialTheme)

        const before = themeSnapshot(initialTheme)
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        setTheme(invalidTheme)

        const warningLogged = consoleWarnSpy.mock.calls.some((call) =>
          String(call[0]).includes('Invalid theme')
        )

        const after = themeSnapshot(initialTheme)
        consoleWarnSpy.mockRestore()

        return (
          warningLogged &&
          after.zustand === before.zustand &&
          after.dom === before.dom &&
          after.storage === before.storage
        )
      }),
      { numRuns: 100, verbose: true }
    )
  })

  it('should reject multiple invalid theme attempts and maintain last valid theme', () => {
    const invalidThemeSequenceArbitrary = fc.array(
      fc.string({ minLength: 1 }).filter(isInvalidThemeString),
      { minLength: 1, maxLength: 5 }
    )
    const validThemeArbitrary = fc.constantFrom(...LEGACY_THEME_IDS)

    fc.assert(
      fc.property(validThemeArbitrary, invalidThemeSequenceArbitrary, (initialTheme, invalidThemeSequence) => {
        resetThemeTestState()
        const { setTheme } = useThemeStore.getState()
        setTheme(initialTheme)

        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        for (const invalidTheme of invalidThemeSequence) {
          setTheme(invalidTheme)
        }

        const warningCount = consoleWarnSpy.mock.calls.filter((call) =>
          call[0].includes('Invalid theme')
        ).length

        const after = themeSnapshot(initialTheme)
        consoleWarnSpy.mockRestore()

        return (
          warningCount === invalidThemeSequence.length &&
          after.zustand === JSON.stringify(LEGACY_THEME_SPEC[initialTheme].theme) &&
          after.dom === LEGACY_THEME_SPEC[initialTheme].key &&
          after.storage === LEGACY_THEME_SPEC[initialTheme].key
        )
      }),
      { numRuns: 50, verbose: true }
    )
  })

  it('should handle mixed valid and invalid theme changes correctly', () => {
    resetThemeTestState()
    const { setTheme } = useThemeStore.getState()
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const sequence = ['not-valid', 'dark', 'also-bad', 'telegram', 'toString']

    let expectedLegacy = 'light'
    for (const theme of sequence) {
      setTheme(theme)
      if (LEGACY_THEME_IDS.includes(theme)) {
        expectedLegacy = theme
      }
    }

    const invalidAttempts = sequence.filter((t) => !LEGACY_THEME_IDS.includes(t)).length
    const warningCount = consoleWarnSpy.mock.calls.filter((call) =>
      String(call[0]).includes('Invalid theme')
    ).length

    const after = themeSnapshot(expectedLegacy)
    consoleWarnSpy.mockRestore()

    expect(warningCount).toBe(invalidAttempts)
    expect(after.zustand).toBe(JSON.stringify(LEGACY_THEME_SPEC[expectedLegacy].theme))
    expect(after.dom).toBe(LEGACY_THEME_SPEC[expectedLegacy].key)
    expect(after.storage).toBe(LEGACY_THEME_SPEC[expectedLegacy].key)
  })

  it('should reject edge case invalid themes including empty strings and special characters', () => {
    const edgeCaseThemeArbitrary = fc.oneof(
      fc.constant(''),
      fc.constant('Light'),
      fc.constant('DARK'),
      fc.constant('WhatsApp'),
      fc.constant('null'),
      fc.constant('undefined'),
      fc.constant('123'),
      fc.constant('light '),
      fc.constant(' dark'),
      fc.constant('light\n'),
      fc.constant('theme-light'),
      fc.string({ minLength: 0, maxLength: 3 }).filter(
        (s) => !LEGACY_THEME_IDS.includes(s) && !/^(whatsapp|telegram)-(light|dark)$/.test(s)
      )
    )
    const validThemeArbitrary = fc.constantFrom(...LEGACY_THEME_IDS)

    fc.assert(
      fc.property(validThemeArbitrary, edgeCaseThemeArbitrary,         (initialTheme, edgeCaseTheme) => {
        resetThemeTestState()
        const { setTheme } = useThemeStore.getState()
        setTheme(initialTheme)

        const before = themeSnapshot(initialTheme)
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        setTheme(edgeCaseTheme)

        const warningLogged = consoleWarnSpy.mock.calls.some((call) =>
          call[0].includes('Invalid theme')
        )

        const after = themeSnapshot(initialTheme)
        consoleWarnSpy.mockRestore()

        return warningLogged && after.zustand === before.zustand
      }),
      { numRuns: 100, verbose: true }
    )
  })
})

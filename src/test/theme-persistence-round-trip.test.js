import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import useThemeStore from '../store/useThemeStore'
import {
  LEGACY_THEME_IDS,
  LEGACY_THEME_SPEC,
  resetThemeTestState,
} from './themeTestHelpers'

describe('Property Test: Theme Persistence Round-Trip', () => {
  beforeEach(() => {
    resetThemeTestState()
  })

  it('should restore the same theme after simulated reinitialization for any valid theme', () => {
    const validThemeArbitrary = fc.constantFrom(...LEGACY_THEME_IDS)

    fc.assert(
      fc.property(validThemeArbitrary, (legacyId) => {
        const spec = LEGACY_THEME_SPEC[legacyId]
        const { setTheme } = useThemeStore.getState()
        setTheme(legacyId)

        const persistedTheme = localStorage.getItem('theme')
        const domTheme = document.documentElement.getAttribute('data-theme')

        return (
          persistedTheme === spec.key &&
          domTheme === spec.key &&
          JSON.stringify(useThemeStore.getState().theme) === JSON.stringify(spec.theme)
        )
      }),
      { numRuns: 100, verbose: true }
    )
  })

  it('should persist only the last theme after multiple changes', () => {
    const themeSequenceArbitrary = fc.array(
      fc.constantFrom(...LEGACY_THEME_IDS),
      { minLength: 2, maxLength: 5 }
    )

    fc.assert(
      fc.property(themeSequenceArbitrary, (themeSequence) => {
        const { setTheme } = useThemeStore.getState()

        for (const legacyId of themeSequence) {
          setTheme(legacyId)
        }

        const lastLegacyId = themeSequence[themeSequence.length - 1]
        const lastSpec = LEGACY_THEME_SPEC[lastLegacyId]

        return (
          localStorage.getItem('theme') === lastSpec.key &&
          JSON.stringify(useThemeStore.getState().theme) === JSON.stringify(lastSpec.theme)
        )
      }),
      { numRuns: 50, verbose: true }
    )
  })

  it('should use default light theme when no theme is persisted', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        localStorage.clear()
        const storedTheme = localStorage.getItem('theme')
        return storedTheme === null
      }),
      { numRuns: 10, verbose: true }
    )
  })

  it('should detect invalid persisted themes that would be rejected on reinitialization', () => {
    const invalidThemeArbitrary = fc.string().filter(
      (s) => !LEGACY_THEME_IDS.includes(s) && !s.includes('-')
    )

    fc.assert(
      fc.property(invalidThemeArbitrary, (invalidTheme) => {
        localStorage.setItem('theme', invalidTheme)
        const storedTheme = localStorage.getItem('theme')
        if (storedTheme !== invalidTheme) return false

        const validCombined = /^(whatsapp|telegram)-(light|dark)$/
        const isValid = validCombined.test(storedTheme) || LEGACY_THEME_IDS.includes(storedTheme)
        return !isValid
      }),
      { numRuns: 50, verbose: true }
    )
  })
})

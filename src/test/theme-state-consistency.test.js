import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import useThemeStore from '../store/useThemeStore'
import {
  LEGACY_THEME_IDS,
  LEGACY_THEME_SPEC,
  resetThemeTestState,
} from './themeTestHelpers'

describe('Property Test: Theme State Consistency', () => {
  beforeEach(() => {
    resetThemeTestState()
  })

  it('should maintain consistency between Zustand state, DOM attribute, and localStorage for any valid theme', () => {
    const validThemeArbitrary = fc.constantFrom(...LEGACY_THEME_IDS)

    fc.assert(
      fc.property(validThemeArbitrary, (legacyId) => {
        const { setTheme } = useThemeStore.getState()
        const spec = LEGACY_THEME_SPEC[legacyId]

        setTheme(legacyId)

        const zustandTheme = useThemeStore.getState().theme
        const domTheme = document.documentElement.getAttribute('data-theme')
        const localStorageTheme = localStorage.getItem('theme')

        return (
          JSON.stringify(zustandTheme) === JSON.stringify(spec.theme) &&
          domTheme === spec.key &&
          localStorageTheme === spec.key
        )
      }),
      { numRuns: 100, verbose: true }
    )
  })

  it('should maintain consistency across multiple sequential theme changes', () => {
    const themeSequenceArbitrary = fc.array(
      fc.constantFrom(...LEGACY_THEME_IDS),
      { minLength: 1, maxLength: 10 }
    )

    fc.assert(
      fc.property(themeSequenceArbitrary, (themeSequence) => {
        const { setTheme } = useThemeStore.getState()

        for (const legacyId of themeSequence) {
          const spec = LEGACY_THEME_SPEC[legacyId]
          setTheme(legacyId)

          const zustandTheme = useThemeStore.getState().theme
          const domTheme = document.documentElement.getAttribute('data-theme')
          const localStorageTheme = localStorage.getItem('theme')

          if (
            JSON.stringify(zustandTheme) !== JSON.stringify(spec.theme) ||
            domTheme !== spec.key ||
            localStorageTheme !== spec.key
          ) {
            return false
          }
        }

        return true
      }),
      { numRuns: 50, verbose: true }
    )
  })

  it('should maintain consistency when setting the same theme multiple times', () => {
    const validThemeArbitrary = fc.constantFrom(...LEGACY_THEME_IDS)
    const repeatCountArbitrary = fc.integer({ min: 1, max: 5 })

    fc.assert(
      fc.property(validThemeArbitrary, repeatCountArbitrary, (legacyId, repeatCount) => {
        const { setTheme } = useThemeStore.getState()
        const spec = LEGACY_THEME_SPEC[legacyId]

        for (let i = 0; i < repeatCount; i++) {
          setTheme(legacyId)
        }

        const zustandTheme = useThemeStore.getState().theme
        const domTheme = document.documentElement.getAttribute('data-theme')
        const localStorageTheme = localStorage.getItem('theme')

        return (
          JSON.stringify(zustandTheme) === JSON.stringify(spec.theme) &&
          domTheme === spec.key &&
          localStorageTheme === spec.key
        )
      }),
      { numRuns: 50, verbose: true }
    )
  })
})

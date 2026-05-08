import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import useThemeStore from '../store/useThemeStore'

describe('Property Test: Theme State Consistency', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset document.documentElement.setAttribute
    document.documentElement.setAttribute('data-theme', 'light')
    // Reset Zustand store to initial state
    useThemeStore.setState({ theme: 'light' })
  })

  /**
   * **Validates: Requirements 2.2, 2.3, 3.1**
   * 
   * Property 1: Theme State Consistency
   * 
   * For any valid theme value, when setTheme is called with that theme,
   * the Zustand state, DOM data-theme attribute, and localStorage must
   * all reflect that theme value consistently.
   */
  it('should maintain consistency between Zustand state, DOM attribute, and localStorage for any valid theme', () => {
    // Generator for valid theme values
    const validThemeArbitrary = fc.constantFrom('light', 'dark', 'whatsapp', 'telegram')

    fc.assert(
      fc.property(validThemeArbitrary, (theme) => {
        // Get the setTheme function from the store
        const { setTheme } = useThemeStore.getState()

        // Call setTheme with the generated theme
        setTheme(theme)

        // Verify Zustand state
        const zustandTheme = useThemeStore.getState().theme

        // Verify DOM data-theme attribute
        const domTheme = document.documentElement.getAttribute('data-theme')

        // Verify localStorage
        const localStorageTheme = localStorage.getItem('theme')

        // All three must be consistent and equal to the set theme
        return (
          zustandTheme === theme &&
          domTheme === theme &&
          localStorageTheme === theme &&
          zustandTheme === domTheme &&
          domTheme === localStorageTheme
        )
      }),
      {
        numRuns: 100, // Run 100 test cases
        verbose: true, // Show detailed output on failure
      }
    )
  })

  /**
   * **Validates: Requirements 2.2, 2.3, 3.1**
   * 
   * Property: Theme State Consistency with Sequential Changes
   * 
   * For any sequence of valid theme changes, each setTheme call must
   * maintain consistency between all three storage locations.
   */
  it('should maintain consistency across multiple sequential theme changes', () => {
    // Generator for an array of valid theme values
    const themeSequenceArbitrary = fc.array(
      fc.constantFrom('light', 'dark', 'whatsapp', 'telegram'),
      { minLength: 1, maxLength: 10 }
    )

    fc.assert(
      fc.property(themeSequenceArbitrary, (themeSequence) => {
        const { setTheme } = useThemeStore.getState()

        // Apply each theme in sequence and verify consistency after each change
        for (const theme of themeSequence) {
          setTheme(theme)

          const zustandTheme = useThemeStore.getState().theme
          const domTheme = document.documentElement.getAttribute('data-theme')
          const localStorageTheme = localStorage.getItem('theme')

          // If any inconsistency is found, return false immediately
          if (
            zustandTheme !== theme ||
            domTheme !== theme ||
            localStorageTheme !== theme
          ) {
            return false
          }
        }

        // All changes maintained consistency
        return true
      }),
      {
        numRuns: 50, // Run 50 test cases with sequences
        verbose: true,
      }
    )
  })

  /**
   * **Validates: Requirements 2.2, 2.3, 3.1**
   * 
   * Property: Theme State Consistency After Idempotent Operations
   * 
   * Setting the same theme multiple times should maintain consistency
   * and the final state should equal the theme value.
   */
  it('should maintain consistency when setting the same theme multiple times', () => {
    const validThemeArbitrary = fc.constantFrom('light', 'dark', 'whatsapp', 'telegram')
    const repeatCountArbitrary = fc.integer({ min: 1, max: 5 })

    fc.assert(
      fc.property(
        validThemeArbitrary,
        repeatCountArbitrary,
        (theme, repeatCount) => {
          const { setTheme } = useThemeStore.getState()

          // Set the same theme multiple times
          for (let i = 0; i < repeatCount; i++) {
            setTheme(theme)
          }

          const zustandTheme = useThemeStore.getState().theme
          const domTheme = document.documentElement.getAttribute('data-theme')
          const localStorageTheme = localStorage.getItem('theme')

          // All three must still be consistent
          return (
            zustandTheme === theme &&
            domTheme === theme &&
            localStorageTheme === theme
          )
        }
      ),
      {
        numRuns: 50,
        verbose: true,
      }
    )
  })
})

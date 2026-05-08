import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import useThemeStore from '../store/useThemeStore'

describe('Property Test: Invalid Theme Rejection', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset document.documentElement.setAttribute
    document.documentElement.setAttribute('data-theme', 'light')
    // Reset Zustand store to initial state
    useThemeStore.setState({ theme: 'light' })
    // Clear all mocks
    vi.clearAllMocks()
  })

  /**
   * **Validates: Requirements 2.5, 18.1**
   * 
   * Property 3: Invalid Theme Rejection
   * 
   * For any string value that is not in the set {'light', 'dark', 'whatsapp', 'telegram'},
   * attempting to set that value as the theme must be rejected, a warning must be logged,
   * and the current theme must remain unchanged.
   */
  it('should reject invalid theme values, log warning, and maintain current theme', () => {
    // Generator for invalid theme strings (any string except valid themes)
    const invalidThemeArbitrary = fc.string().filter(
      s => !['light', 'dark', 'whatsapp', 'telegram'].includes(s)
    )

    // Generator for valid initial theme
    const validThemeArbitrary = fc.constantFrom('light', 'dark', 'whatsapp', 'telegram')

    fc.assert(
      fc.property(
        validThemeArbitrary,
        invalidThemeArbitrary,
        (initialTheme, invalidTheme) => {
          // Step 1: Set a valid initial theme
          const { setTheme } = useThemeStore.getState()
          setTheme(initialTheme)

          // Step 2: Capture initial state before attempting invalid theme
          const initialZustandTheme = useThemeStore.getState().theme
          const initialDomTheme = document.documentElement.getAttribute('data-theme')
          const initialLocalStorageTheme = localStorage.getItem('theme')

          // Step 3: Spy on console.warn to verify warning is logged
          const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

          // Step 4: Attempt to set invalid theme
          setTheme(invalidTheme)

          // Step 5: Verify warning was logged
          const warningLogged = consoleWarnSpy.mock.calls.some(call => 
            call[0].includes('Invalid theme') && call[0].includes(invalidTheme)
          )

          // Step 6: Verify state remained unchanged
          const finalZustandTheme = useThemeStore.getState().theme
          const finalDomTheme = document.documentElement.getAttribute('data-theme')
          const finalLocalStorageTheme = localStorage.getItem('theme')

          // Step 7: Restore console.warn
          consoleWarnSpy.mockRestore()

          // Step 8: Verify all conditions
          return (
            warningLogged &&
            finalZustandTheme === initialZustandTheme &&
            finalDomTheme === initialDomTheme &&
            finalLocalStorageTheme === initialLocalStorageTheme &&
            finalZustandTheme === initialTheme &&
            finalDomTheme === initialTheme &&
            finalLocalStorageTheme === initialTheme
          )
        }
      ),
      {
        numRuns: 100, // Run 100 test cases
        verbose: true, // Show detailed output on failure
      }
    )
  })

  /**
   * **Validates: Requirements 2.5, 18.1**
   * 
   * Property: Invalid Theme Rejection with Multiple Attempts
   * 
   * Multiple attempts to set invalid themes should all be rejected,
   * and the theme should remain at its last valid value.
   */
  it('should reject multiple invalid theme attempts and maintain last valid theme', () => {
    // Generator for a sequence of invalid theme strings
    const invalidThemeSequenceArbitrary = fc.array(
      fc.string().filter(s => !['light', 'dark', 'whatsapp', 'telegram'].includes(s)),
      { minLength: 1, maxLength: 5 }
    )

    // Generator for valid initial theme
    const validThemeArbitrary = fc.constantFrom('light', 'dark', 'whatsapp', 'telegram')

    fc.assert(
      fc.property(
        validThemeArbitrary,
        invalidThemeSequenceArbitrary,
        (initialTheme, invalidThemeSequence) => {
          // Step 1: Set a valid initial theme
          const { setTheme } = useThemeStore.getState()
          setTheme(initialTheme)

          // Step 2: Spy on console.warn
          const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

          // Step 3: Attempt to set each invalid theme
          for (const invalidTheme of invalidThemeSequence) {
            setTheme(invalidTheme)
          }

          // Step 4: Verify warnings were logged for each invalid attempt
          const warningCount = consoleWarnSpy.mock.calls.filter(call =>
            call[0].includes('Invalid theme')
          ).length

          // Step 5: Verify state remained at initial valid theme
          const finalZustandTheme = useThemeStore.getState().theme
          const finalDomTheme = document.documentElement.getAttribute('data-theme')
          const finalLocalStorageTheme = localStorage.getItem('theme')

          // Step 6: Restore console.warn
          consoleWarnSpy.mockRestore()

          // Step 7: Verify all conditions
          return (
            warningCount === invalidThemeSequence.length &&
            finalZustandTheme === initialTheme &&
            finalDomTheme === initialTheme &&
            finalLocalStorageTheme === initialTheme
          )
        }
      ),
      {
        numRuns: 50, // Run 50 test cases
        verbose: true,
      }
    )
  })

  /**
   * **Validates: Requirements 2.5, 18.1**
   * 
   * Property: Invalid Theme Rejection Mixed with Valid Changes
   * 
   * When invalid theme attempts are mixed with valid theme changes,
   * only valid changes should be applied, and invalid attempts should
   * be rejected without affecting the state.
   */
  it('should handle mixed valid and invalid theme changes correctly', () => {
    // Generator for a mixed sequence of valid and invalid themes
    const mixedThemeSequenceArbitrary = fc.array(
      fc.oneof(
        fc.constantFrom('light', 'dark', 'whatsapp', 'telegram'),
        fc.string().filter(s => !['light', 'dark', 'whatsapp', 'telegram'].includes(s))
      ),
      { minLength: 2, maxLength: 10 }
    )

    fc.assert(
      fc.property(mixedThemeSequenceArbitrary, (themeSequence) => {
        // Step 1: Start with default 'light' theme
        const { setTheme } = useThemeStore.getState()
        useThemeStore.setState({ theme: 'light' })
        document.documentElement.setAttribute('data-theme', 'light')
        localStorage.setItem('theme', 'light')

        // Step 2: Track expected theme (last valid theme)
        let expectedTheme = 'light'
        const validThemes = ['light', 'dark', 'whatsapp', 'telegram']

        // Step 3: Spy on console.warn
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        // Step 4: Apply each theme in sequence
        for (const theme of themeSequence) {
          setTheme(theme)
          
          // Update expected theme only if valid
          if (validThemes.includes(theme)) {
            expectedTheme = theme
          }
        }

        // Step 5: Verify final state matches last valid theme
        const finalZustandTheme = useThemeStore.getState().theme
        const finalDomTheme = document.documentElement.getAttribute('data-theme')
        const finalLocalStorageTheme = localStorage.getItem('theme')

        // Step 6: Count invalid attempts
        const invalidAttempts = themeSequence.filter(t => !validThemes.includes(t)).length
        const warningCount = consoleWarnSpy.mock.calls.filter(call =>
          call[0].includes('Invalid theme')
        ).length

        // Step 7: Restore console.warn
        consoleWarnSpy.mockRestore()

        // Step 8: Verify all conditions
        return (
          warningCount === invalidAttempts &&
          finalZustandTheme === expectedTheme &&
          finalDomTheme === expectedTheme &&
          finalLocalStorageTheme === expectedTheme
        )
      }),
      {
        numRuns: 50, // Run 50 test cases
        verbose: true,
      }
    )
  })

  /**
   * **Validates: Requirements 2.5, 18.1**
   * 
   * Property: Invalid Theme Rejection with Edge Cases
   * 
   * Test edge cases like empty strings, null-like strings, special characters,
   * and case variations to ensure robust validation.
   */
  it('should reject edge case invalid themes including empty strings and special characters', () => {
    // Generator for edge case invalid themes
    const edgeCaseThemeArbitrary = fc.oneof(
      fc.constant(''),
      fc.constant('Light'), // Case variation
      fc.constant('DARK'),
      fc.constant('WhatsApp'),
      fc.constant('null'),
      fc.constant('undefined'),
      fc.constant('123'),
      fc.constant('light '), // With space
      fc.constant(' dark'),
      fc.constant('light\n'),
      fc.constant('theme-light'),
      fc.string({ minLength: 0, maxLength: 3 }).filter(
        s => !['light', 'dark', 'whatsapp', 'telegram'].includes(s)
      )
    )

    // Generator for valid initial theme
    const validThemeArbitrary = fc.constantFrom('light', 'dark', 'whatsapp', 'telegram')

    fc.assert(
      fc.property(
        validThemeArbitrary,
        edgeCaseThemeArbitrary,
        (initialTheme, edgeCaseTheme) => {
          // Step 1: Set a valid initial theme
          const { setTheme } = useThemeStore.getState()
          setTheme(initialTheme)

          // Step 2: Capture initial state
          const initialZustandTheme = useThemeStore.getState().theme

          // Step 3: Spy on console.warn
          const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

          // Step 4: Attempt to set edge case invalid theme
          setTheme(edgeCaseTheme)

          // Step 5: Verify warning was logged
          const warningLogged = consoleWarnSpy.mock.calls.some(call =>
            call[0].includes('Invalid theme')
          )

          // Step 6: Verify state remained unchanged
          const finalZustandTheme = useThemeStore.getState().theme

          // Step 7: Restore console.warn
          consoleWarnSpy.mockRestore()

          // Step 8: Verify all conditions
          return (
            warningLogged &&
            finalZustandTheme === initialZustandTheme &&
            finalZustandTheme === initialTheme
          )
        }
      ),
      {
        numRuns: 100, // Run 100 test cases
        verbose: true,
      }
    )
  })
})

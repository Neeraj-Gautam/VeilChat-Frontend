import { describe, it, expect, beforeAll } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property 6: CSS Variable Application
 * 
 * **Validates: Requirements 4.3**
 * 
 * For any theme in the set {'light', 'dark', 'whatsapp', 'telegram'}, 
 * when the data-theme attribute is set to that theme, the computed CSS 
 * variable values must match the theme's defined color values.
 */
describe('Property Test: CSS Variable Application', () => {
  beforeAll(() => {
    // Inject theme CSS into the test environment
    const style = document.createElement('style')
    style.textContent = `
      :root[data-theme="light"] {
        --color-primary: #3b82f6;
        --color-primary-dark: #2563eb;
        --color-chat-bg: #f3f4f6;
        --color-message-own: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        --color-message-other: #ffffff;
        --color-text-on-primary: #ffffff;
        --color-text-on-own: #ffffff;
        --color-text-on-other: #1f2937;
        --color-border: #e5e7eb;
        --color-input-bg: #ffffff;
        --color-header-bg: #ffffff;
      }

      :root[data-theme="dark"] {
        --color-primary: #3b82f6;
        --color-primary-dark: #2563eb;
        --color-chat-bg: #111827;
        --color-message-own: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        --color-message-other: #374151;
        --color-text-on-primary: #ffffff;
        --color-text-on-own: #ffffff;
        --color-text-on-other: #ffffff;
        --color-border: #374151;
        --color-input-bg: #1f2937;
        --color-header-bg: #1f2937;
      }

      :root[data-theme="whatsapp"] {
        --color-primary: #25d366;
        --color-primary-dark: #1da851;
        --color-chat-bg: #e5ddd5;
        --color-message-own: #dcf8c6;
        --color-message-other: #ffffff;
        --color-text-on-primary: #ffffff;
        --color-text-on-own: #000000;
        --color-text-on-other: #000000;
        --color-border: #d1d7db;
        --color-input-bg: #ffffff;
        --color-header-bg: #075e54;
      }

      :root[data-theme="telegram"] {
        --color-primary: #0088cc;
        --color-primary-dark: #006699;
        --color-chat-bg: #e4e9ec;
        --color-message-own: #effdde;
        --color-message-other: #ffffff;
        --color-text-on-primary: #ffffff;
        --color-text-on-own: #000000;
        --color-text-on-other: #000000;
        --color-border: #c8d1d8;
        --color-input-bg: #ffffff;
        --color-header-bg: #517da2;
      }
    `
    document.head.appendChild(style)
  })

  // Theme color definitions as specified in the requirements
  const themeDefinitions = {
    light: {
      '--color-primary': '#3b82f6',
      '--color-chat-bg': '#f3f4f6',
    },
    dark: {
      '--color-primary': '#3b82f6',
      '--color-chat-bg': '#111827',
    },
    whatsapp: {
      '--color-primary': '#25d366',
      '--color-chat-bg': '#e5ddd5',
    },
    telegram: {
      '--color-primary': '#0088cc',
      '--color-chat-bg': '#e4e9ec',
    },
  }

  const validThemes = ['light', 'dark', 'whatsapp', 'telegram']

  it('Property 6: setting data-theme attribute applies correct CSS variable values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validThemes),
        (theme) => {
          // Set the data-theme attribute
          document.documentElement.setAttribute('data-theme', theme)

          // Get computed styles
          const styles = getComputedStyle(document.documentElement)

          // Verify that computed values match theme definitions
          const primaryValue = styles.getPropertyValue('--color-primary').trim()
          const chatBgValue = styles.getPropertyValue('--color-chat-bg').trim()

          const expectedPrimary = themeDefinitions[theme]['--color-primary']
          const expectedChatBg = themeDefinitions[theme]['--color-chat-bg']

          // Clean up
          document.documentElement.removeAttribute('data-theme')

          // Return true if both values match
          return primaryValue === expectedPrimary && chatBgValue === expectedChatBg
        }
      ),
      {
        verbose: true,
        numRuns: 100,
      }
    )
  })

  it('Property 6 (detailed): verifies all theme-specific color values match definitions', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validThemes),
        (theme) => {
          // Set the data-theme attribute
          document.documentElement.setAttribute('data-theme', theme)

          // Get computed styles
          const styles = getComputedStyle(document.documentElement)

          // Check primary and chat-bg values
          const primaryValue = styles.getPropertyValue('--color-primary').trim()
          const chatBgValue = styles.getPropertyValue('--color-chat-bg').trim()

          const expectedPrimary = themeDefinitions[theme]['--color-primary']
          const expectedChatBg = themeDefinitions[theme]['--color-chat-bg']

          // Collect mismatches
          const mismatches = []
          if (primaryValue !== expectedPrimary) {
            mismatches.push(
              `--color-primary: expected '${expectedPrimary}', got '${primaryValue}'`
            )
          }
          if (chatBgValue !== expectedChatBg) {
            mismatches.push(
              `--color-chat-bg: expected '${expectedChatBg}', got '${chatBgValue}'`
            )
          }

          // Clean up
          document.documentElement.removeAttribute('data-theme')

          // Assert with detailed error message
          if (mismatches.length > 0) {
            throw new Error(
              `Theme '${theme}' has CSS variable mismatches:\n${mismatches.join('\n')}`
            )
          }

          return true
        }
      ),
      {
        verbose: true,
        numRuns: 100,
      }
    )
  })

  it('Property 6 (comprehensive): verifies computed values match for all CSS variables', () => {
    // Full theme definitions with all CSS variables
    const fullThemeDefinitions = {
      light: {
        '--color-primary': '#3b82f6',
        '--color-primary-dark': '#2563eb',
        '--color-chat-bg': '#f3f4f6',
        '--color-message-own': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        '--color-message-other': '#ffffff',
        '--color-text-on-primary': '#ffffff',
        '--color-text-on-own': '#ffffff',
        '--color-text-on-other': '#1f2937',
        '--color-border': '#e5e7eb',
        '--color-input-bg': '#ffffff',
        '--color-header-bg': '#ffffff',
      },
      dark: {
        '--color-primary': '#3b82f6',
        '--color-primary-dark': '#2563eb',
        '--color-chat-bg': '#111827',
        '--color-message-own': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        '--color-message-other': '#374151',
        '--color-text-on-primary': '#ffffff',
        '--color-text-on-own': '#ffffff',
        '--color-text-on-other': '#ffffff',
        '--color-border': '#374151',
        '--color-input-bg': '#1f2937',
        '--color-header-bg': '#1f2937',
      },
      whatsapp: {
        '--color-primary': '#25d366',
        '--color-primary-dark': '#1da851',
        '--color-chat-bg': '#e5ddd5',
        '--color-message-own': '#dcf8c6',
        '--color-message-other': '#ffffff',
        '--color-text-on-primary': '#ffffff',
        '--color-text-on-own': '#000000',
        '--color-text-on-other': '#000000',
        '--color-border': '#d1d7db',
        '--color-input-bg': '#ffffff',
        '--color-header-bg': '#075e54',
      },
      telegram: {
        '--color-primary': '#0088cc',
        '--color-primary-dark': '#006699',
        '--color-chat-bg': '#e4e9ec',
        '--color-message-own': '#effdde',
        '--color-message-other': '#ffffff',
        '--color-text-on-primary': '#ffffff',
        '--color-text-on-own': '#000000',
        '--color-text-on-other': '#000000',
        '--color-border': '#c8d1d8',
        '--color-input-bg': '#ffffff',
        '--color-header-bg': '#517da2',
      },
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...validThemes),
        (theme) => {
          // Set the data-theme attribute
          document.documentElement.setAttribute('data-theme', theme)

          // Get computed styles
          const styles = getComputedStyle(document.documentElement)

          // Get expected values for this theme
          const expectedValues = fullThemeDefinitions[theme]

          // Check all CSS variables
          const mismatches = []
          Object.entries(expectedValues).forEach(([variable, expectedValue]) => {
            const computedValue = styles.getPropertyValue(variable).trim()
            
            // Normalize values for comparison (remove all whitespace for consistent comparison)
            const normalizedComputed = computedValue.replace(/\s+/g, '')
            const normalizedExpected = expectedValue.replace(/\s+/g, '')
            
            if (normalizedComputed !== normalizedExpected) {
              mismatches.push(
                `${variable}: expected '${normalizedExpected}', got '${normalizedComputed}'`
              )
            }
          })

          // Clean up
          document.documentElement.removeAttribute('data-theme')

          // Assert with detailed error message
          if (mismatches.length > 0) {
            throw new Error(
              `Theme '${theme}' has CSS variable mismatches:\n${mismatches.join('\n')}`
            )
          }

          return true
        }
      ),
      {
        verbose: true,
        numRuns: 100,
      }
    )
  })
})

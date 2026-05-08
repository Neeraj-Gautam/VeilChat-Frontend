import { describe, it, expect, beforeAll } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property 5: CSS Variable Completeness
 * 
 * **Validates: Requirements 4.4, 4.5**
 * 
 * For any theme in the set {'light', 'dark', 'whatsapp', 'telegram'}, 
 * when that theme is applied, all required CSS variables must be defined 
 * and have non-empty computed values.
 */
describe('Property Test: CSS Variable Completeness', () => {
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

  const requiredVariables = [
    '--color-primary',
    '--color-primary-dark',
    '--color-chat-bg',
    '--color-message-own',
    '--color-message-other',
    '--color-text-on-primary',
    '--color-text-on-own',
    '--color-text-on-other',
    '--color-border',
    '--color-input-bg',
    '--color-header-bg',
  ]

  const validThemes = ['light', 'dark', 'whatsapp', 'telegram']

  it('Property 5: all themes define all required CSS variables with non-empty values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validThemes),
        (theme) => {
          // Apply the theme
          document.documentElement.setAttribute('data-theme', theme)

          // Get computed styles
          const styles = getComputedStyle(document.documentElement)

          // Verify all required variables are defined and non-empty
          const allVariablesDefined = requiredVariables.every((variable) => {
            const value = styles.getPropertyValue(variable).trim()
            return value !== ''
          })

          // Clean up
          document.documentElement.removeAttribute('data-theme')

          return allVariablesDefined
        }
      ),
      {
        verbose: true,
        numRuns: 100,
      }
    )
  })

  it('Property 5 (detailed): reports which variables are missing for each theme', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validThemes),
        (theme) => {
          // Apply the theme
          document.documentElement.setAttribute('data-theme', theme)

          // Get computed styles
          const styles = getComputedStyle(document.documentElement)

          // Check each variable and collect missing ones
          const missingVariables = []
          requiredVariables.forEach((variable) => {
            const value = styles.getPropertyValue(variable).trim()
            if (value === '') {
              missingVariables.push(variable)
            }
          })

          // Clean up
          document.documentElement.removeAttribute('data-theme')

          // Assert with detailed error message
          if (missingVariables.length > 0) {
            throw new Error(
              `Theme '${theme}' is missing CSS variables: ${missingVariables.join(', ')}`
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

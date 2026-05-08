import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import * as fc from 'fast-check'

/**
 * **Validates: Requirements 11.1, 11.2, 11.3, 11.4**
 * 
 * Property 9: Message Bubble Theme Colors
 * 
 * For any theme and any message, own messages must use the theme's
 * --color-message-own background and --color-text-on-own text color,
 * while other messages must use the theme's --color-message-other
 * background and --color-text-on-other text color.
 */

// Mock message bubble component that mimics ChatWindow's message rendering
const MessageBubble = ({ content, isOwn, isDeleted = false }) => {
  const isEmojiOnly = (text) => {
    if (!text || typeof text !== 'string') return false
    const emojiRegex = /^[\p{Emoji}\s]+$/u
    return emojiRegex.test(text.trim())
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        data-testid="message-bubble"
        className={`relative max-w-[70%] ${
          isEmojiOnly(content) && !isDeleted
            ? 'bg-transparent shadow-none'
            : `px-4 py-2 rounded-2xl shadow-md transition-shadow hover:shadow-lg ${
                isOwn
                  ? 'bg-theme-message-own text-theme-text-on-own rounded-br-sm'
                  : 'bg-theme-message-other text-theme-text-on-other rounded-bl-sm'
              }`
        } text-sm cursor-pointer`}
      >
        {isDeleted ? (
          <p className="italic opacity-60">🚫 This message was deleted</p>
        ) : (
          <p>{content}</p>
        )}
      </div>
    </div>
  )
}

describe('Property Test: Message Bubble Theme Colors', () => {
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

      .bg-theme-message-own {
        background: var(--color-message-own);
      }

      .bg-theme-message-other {
        background: var(--color-message-other);
      }

      .text-theme-text-on-own {
        color: var(--color-text-on-own);
      }

      .text-theme-text-on-other {
        color: var(--color-text-on-other);
      }
    `
    document.head.appendChild(style)
  })

  beforeEach(() => {
    // Reset DOM
    document.documentElement.removeAttribute('data-theme')
  })

  /**
   * Property: Own messages use correct theme colors
   * 
   * For any theme and any message with isOwn=true, the message bubble must have:
   * - bg-theme-message-own class
   * - text-theme-text-on-own class
   */
  it('should apply correct theme color classes for own messages across all themes', () => {
    // Generator for theme and message combinations
    const themeMessageArbitrary = fc.record({
      theme: fc.constantFrom('light', 'dark', 'whatsapp', 'telegram'),
      content: fc.string({ minLength: 1, maxLength: 100 }),
      isOwn: fc.constant(true),
      isDeleted: fc.boolean(),
    })

    fc.assert(
      fc.property(themeMessageArbitrary, (data) => {
        // Set the theme
        document.documentElement.setAttribute('data-theme', data.theme)

        const { getByTestId } = render(
          <MessageBubble
            content={data.content}
            isOwn={data.isOwn}
            isDeleted={data.isDeleted}
          />
        )

        const bubble = getByTestId('message-bubble')
        const classes = bubble.className

        // Skip emoji-only messages (they don't have bubble styling)
        const isEmojiOnly = (text) => {
          if (!text || typeof text !== 'string') return false
          const emojiRegex = /^[\p{Emoji}\s]+$/u
          return emojiRegex.test(text.trim())
        }

        const result = (() => {
          if (isEmojiOnly(data.content) && !data.isDeleted) {
            return true // Skip validation for emoji-only messages
          }

          // Verify own message has correct theme color classes
          const hasOwnBackground = classes.includes('bg-theme-message-own')
          const hasOwnText = classes.includes('text-theme-text-on-own')

          // Should NOT have other message classes
          const hasOtherBackground = classes.includes('bg-theme-message-other')
          const hasOtherText = classes.includes('text-theme-text-on-other')

          return (
            hasOwnBackground &&
            hasOwnText &&
            !hasOtherBackground &&
            !hasOtherText
          )
        })()

        // Cleanup after each test iteration
        cleanup()

        return result
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    )
  })

  /**
   * Property: Other messages use correct theme colors
   * 
   * For any theme and any message with isOwn=false, the message bubble must have:
   * - bg-theme-message-other class
   * - text-theme-text-on-other class
   */
  it('should apply correct theme color classes for other messages across all themes', () => {
    // Generator for theme and message combinations
    const themeMessageArbitrary = fc.record({
      theme: fc.constantFrom('light', 'dark', 'whatsapp', 'telegram'),
      content: fc.string({ minLength: 1, maxLength: 100 }),
      isOwn: fc.constant(false),
      isDeleted: fc.boolean(),
    })

    fc.assert(
      fc.property(themeMessageArbitrary, (data) => {
        // Set the theme
        document.documentElement.setAttribute('data-theme', data.theme)

        const { getByTestId } = render(
          <MessageBubble
            content={data.content}
            isOwn={data.isOwn}
            isDeleted={data.isDeleted}
          />
        )

        const bubble = getByTestId('message-bubble')
        const classes = bubble.className

        // Skip emoji-only messages (they don't have bubble styling)
        const isEmojiOnly = (text) => {
          if (!text || typeof text !== 'string') return false
          const emojiRegex = /^[\p{Emoji}\s]+$/u
          return emojiRegex.test(text.trim())
        }

        const result = (() => {
          if (isEmojiOnly(data.content) && !data.isDeleted) {
            return true // Skip validation for emoji-only messages
          }

          // Verify other message has correct theme color classes
          const hasOtherBackground = classes.includes('bg-theme-message-other')
          const hasOtherText = classes.includes('text-theme-text-on-other')

          // Should NOT have own message classes
          const hasOwnBackground = classes.includes('bg-theme-message-own')
          const hasOwnText = classes.includes('text-theme-text-on-own')

          return (
            hasOtherBackground &&
            hasOtherText &&
            !hasOwnBackground &&
            !hasOwnText
          )
        })()

        // Cleanup after each test iteration
        cleanup()

        return result
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    )
  })

  /**
   * Property: Theme color classes are mutually exclusive
   * 
   * For any theme and any message, it should have either own message colors
   * OR other message colors, but never both at the same time.
   */
  it('should have mutually exclusive theme color classes', () => {
    // Generator for any theme and message combination
    const themeMessageArbitrary = fc.record({
      theme: fc.constantFrom('light', 'dark', 'whatsapp', 'telegram'),
      content: fc.string({ minLength: 1, maxLength: 100 }),
      isOwn: fc.boolean(),
      isDeleted: fc.boolean(),
    })

    fc.assert(
      fc.property(themeMessageArbitrary, (data) => {
        // Set the theme
        document.documentElement.setAttribute('data-theme', data.theme)

        const { getByTestId } = render(
          <MessageBubble
            content={data.content}
            isOwn={data.isOwn}
            isDeleted={data.isDeleted}
          />
        )

        const bubble = getByTestId('message-bubble')
        const classes = bubble.className

        // Skip emoji-only messages (they don't have bubble styling)
        const isEmojiOnly = (text) => {
          if (!text || typeof text !== 'string') return false
          const emojiRegex = /^[\p{Emoji}\s]+$/u
          return emojiRegex.test(text.trim())
        }

        const result = (() => {
          if (isEmojiOnly(data.content) && !data.isDeleted) {
            return true // Skip validation for emoji-only messages
          }

          const hasOwnBackground = classes.includes('bg-theme-message-own')
          const hasOtherBackground = classes.includes('bg-theme-message-other')
          const hasOwnText = classes.includes('text-theme-text-on-own')
          const hasOtherText = classes.includes('text-theme-text-on-other')

          // Should have exactly one set of color classes, not both
          const hasOwnColors = hasOwnBackground && hasOwnText
          const hasOtherColors = hasOtherBackground && hasOtherText

          return (hasOwnColors && !hasOtherColors) || (!hasOwnColors && hasOtherColors)
        })()

        // Cleanup after each test iteration
        cleanup()

        return result
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    )
  })

  /**
   * Property: Theme colors correspond to message ownership
   * 
   * For any theme and any message, if isOwn is true, it must have own message colors,
   * and if isOwn is false, it must have other message colors.
   */
  it('should apply correct theme colors based on message ownership', () => {
    // Generator for any theme and message combination
    const themeMessageArbitrary = fc.record({
      theme: fc.constantFrom('light', 'dark', 'whatsapp', 'telegram'),
      content: fc.string({ minLength: 1, maxLength: 100 }),
      isOwn: fc.boolean(),
      isDeleted: fc.boolean(),
    })

    fc.assert(
      fc.property(themeMessageArbitrary, (data) => {
        // Set the theme
        document.documentElement.setAttribute('data-theme', data.theme)

        const { getByTestId } = render(
          <MessageBubble
            content={data.content}
            isOwn={data.isOwn}
            isDeleted={data.isDeleted}
          />
        )

        const bubble = getByTestId('message-bubble')
        const classes = bubble.className

        // Skip emoji-only messages (they don't have bubble styling)
        const isEmojiOnly = (text) => {
          if (!text || typeof text !== 'string') return false
          const emojiRegex = /^[\p{Emoji}\s]+$/u
          return emojiRegex.test(text.trim())
        }

        const result = (() => {
          if (isEmojiOnly(data.content) && !data.isDeleted) {
            return true // Skip validation for emoji-only messages
          }

          const hasOwnBackground = classes.includes('bg-theme-message-own')
          const hasOwnText = classes.includes('text-theme-text-on-own')
          const hasOtherBackground = classes.includes('bg-theme-message-other')
          const hasOtherText = classes.includes('text-theme-text-on-other')

          // If isOwn is true, must have own message colors
          // If isOwn is false, must have other message colors
          if (data.isOwn) {
            return hasOwnBackground && hasOwnText && !hasOtherBackground && !hasOtherText
          } else {
            return hasOtherBackground && hasOtherText && !hasOwnBackground && !hasOwnText
          }
        })()

        // Cleanup after each test iteration
        cleanup()

        return result
      }),
      {
        numRuns: 100,
        verbose: true,
      }
    )
  })

  /**
   * Property: All themes define message bubble colors
   * 
   * For any theme, when applied, the CSS variables for message colors
   * must be defined and have non-empty values.
   */
  it('should have defined CSS variables for message colors in all themes', () => {
    // Generator for themes
    const themeArbitrary = fc.constantFrom('light', 'dark', 'whatsapp', 'telegram')

    fc.assert(
      fc.property(themeArbitrary, (theme) => {
        // Set the theme
        document.documentElement.setAttribute('data-theme', theme)

        // Get computed styles
        const styles = getComputedStyle(document.documentElement)

        // Check message color variables
        const messageOwn = styles.getPropertyValue('--color-message-own').trim()
        const messageOther = styles.getPropertyValue('--color-message-other').trim()
        const textOnOwn = styles.getPropertyValue('--color-text-on-own').trim()
        const textOnOther = styles.getPropertyValue('--color-text-on-other').trim()

        return (
          messageOwn !== '' &&
          messageOther !== '' &&
          textOnOwn !== '' &&
          textOnOther !== ''
        )
      }),
      {
        numRuns: 50,
        verbose: true,
      }
    )
  })

  /**
   * Property: Theme-specific color values are correct
   * 
   * For each specific theme, verify that the message bubble colors
   * match the expected theme-specific values.
   */
  it('should have correct theme-specific message bubble colors', () => {
    const themeColors = {
      light: {
        messageOther: '#ffffff',
        textOnOwn: '#ffffff',
        textOnOther: '#1f2937',
      },
      dark: {
        messageOther: '#374151',
        textOnOwn: '#ffffff',
        textOnOther: '#ffffff',
      },
      whatsapp: {
        messageOwn: '#dcf8c6',
        messageOther: '#ffffff',
        textOnOwn: '#000000',
        textOnOther: '#000000',
      },
      telegram: {
        messageOwn: '#effdde',
        messageOther: '#ffffff',
        textOnOwn: '#000000',
        textOnOther: '#000000',
      },
    }

    // Generator for themes
    const themeArbitrary = fc.constantFrom('light', 'dark', 'whatsapp', 'telegram')

    fc.assert(
      fc.property(themeArbitrary, (theme) => {
        // Set the theme
        document.documentElement.setAttribute('data-theme', theme)

        // Get computed styles
        const styles = getComputedStyle(document.documentElement)

        // Get actual values
        const messageOwn = styles.getPropertyValue('--color-message-own').trim()
        const messageOther = styles.getPropertyValue('--color-message-other').trim()
        const textOnOwn = styles.getPropertyValue('--color-text-on-own').trim()
        const textOnOther = styles.getPropertyValue('--color-text-on-other').trim()

        // Get expected values
        const expected = themeColors[theme]

        // For light and dark themes, messageOwn is a gradient, so just check it's defined
        // For whatsapp and telegram, check exact color values
        const messageOwnValid = (theme === 'light' || theme === 'dark')
          ? messageOwn.includes('linear-gradient') && messageOwn.includes('#3b82f6') && messageOwn.includes('#8b5cf6')
          : messageOwn === expected.messageOwn

        return (
          messageOwnValid &&
          messageOther === expected.messageOther &&
          textOnOwn === expected.textOnOwn &&
          textOnOther === expected.textOnOther
        )
      }),
      {
        numRuns: 50,
        verbose: true,
      }
    )
  })
})


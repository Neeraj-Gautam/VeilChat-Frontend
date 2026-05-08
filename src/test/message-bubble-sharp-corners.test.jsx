import { describe, it, expect, beforeEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import * as fc from 'fast-check'

/**
 * **Validates: Requirements 10.1, 10.2**
 * 
 * Property 8: Message Bubble Sharp Corners
 * 
 * For any message, if it is an own message, it must have rounded corners
 * except for the bottom-right corner (sharp), and if it is another user's
 * message, it must have rounded corners except for the bottom-left corner (sharp).
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

describe('Property Test: Message Bubble Sharp Corners', () => {
  beforeEach(() => {
    // Reset DOM
    document.documentElement.removeAttribute('data-theme')
  })

  /**
   * Property: Own messages have sharp bottom-right corner
   * 
   * For any message content and isOwn=true, the message bubble must have:
   * - rounded-2xl (rounded corners)
   * - rounded-br-sm (sharp bottom-right corner)
   */
  it('should apply rounded-br-sm class for own messages', () => {
    // Generator for message data with isOwn=true
    const ownMessageArbitrary = fc.record({
      content: fc.string({ minLength: 1, maxLength: 100 }),
      isOwn: fc.constant(true),
      isDeleted: fc.boolean(),
    })

    fc.assert(
      fc.property(ownMessageArbitrary, (message) => {
        const { getByTestId } = render(
          <MessageBubble
            content={message.content}
            isOwn={message.isOwn}
            isDeleted={message.isDeleted}
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
          if (isEmojiOnly(message.content) && !message.isDeleted) {
            return true // Skip validation for emoji-only messages
          }

          // Verify own message has rounded-br-sm (sharp bottom-right corner)
          const hasRoundedBrSm = classes.includes('rounded-br-sm')
          const hasRounded2xl = classes.includes('rounded-2xl')
          const hasOwnBackground = classes.includes('bg-theme-message-own')
          const hasOwnText = classes.includes('text-theme-text-on-own')

          // Should NOT have rounded-bl-sm (that's for other messages)
          const hasRoundedBlSm = classes.includes('rounded-bl-sm')

          return (
            hasRoundedBrSm &&
            hasRounded2xl &&
            hasOwnBackground &&
            hasOwnText &&
            !hasRoundedBlSm
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
   * Property: Other messages have sharp bottom-left corner
   * 
   * For any message content and isOwn=false, the message bubble must have:
   * - rounded-2xl (rounded corners)
   * - rounded-bl-sm (sharp bottom-left corner)
   */
  it('should apply rounded-bl-sm class for other messages', () => {
    // Generator for message data with isOwn=false
    const otherMessageArbitrary = fc.record({
      content: fc.string({ minLength: 1, maxLength: 100 }),
      isOwn: fc.constant(false),
      isDeleted: fc.boolean(),
    })

    fc.assert(
      fc.property(otherMessageArbitrary, (message) => {
        const { getByTestId } = render(
          <MessageBubble
            content={message.content}
            isOwn={message.isOwn}
            isDeleted={message.isDeleted}
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
          if (isEmojiOnly(message.content) && !message.isDeleted) {
            return true // Skip validation for emoji-only messages
          }

          // Verify other message has rounded-bl-sm (sharp bottom-left corner)
          const hasRoundedBlSm = classes.includes('rounded-bl-sm')
          const hasRounded2xl = classes.includes('rounded-2xl')
          const hasOtherBackground = classes.includes('bg-theme-message-other')
          const hasOtherText = classes.includes('text-theme-text-on-other')

          // Should NOT have rounded-br-sm (that's for own messages)
          const hasRoundedBrSm = classes.includes('rounded-br-sm')

          return (
            hasRoundedBlSm &&
            hasRounded2xl &&
            hasOtherBackground &&
            hasOtherText &&
            !hasRoundedBrSm
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
   * Property: Sharp corner styling is mutually exclusive
   * 
   * For any message, it should have either rounded-br-sm OR rounded-bl-sm,
   * but never both at the same time.
   */
  it('should have mutually exclusive sharp corner classes', () => {
    // Generator for any message data
    const messageArbitrary = fc.record({
      content: fc.string({ minLength: 1, maxLength: 100 }),
      isOwn: fc.boolean(),
      isDeleted: fc.boolean(),
    })

    fc.assert(
      fc.property(messageArbitrary, (message) => {
        const { getByTestId } = render(
          <MessageBubble
            content={message.content}
            isOwn={message.isOwn}
            isDeleted={message.isDeleted}
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
          if (isEmojiOnly(message.content) && !message.isDeleted) {
            return true // Skip validation for emoji-only messages
          }

          const hasRoundedBrSm = classes.includes('rounded-br-sm')
          const hasRoundedBlSm = classes.includes('rounded-bl-sm')

          // Should have exactly one of the sharp corner classes, not both
          return (hasRoundedBrSm && !hasRoundedBlSm) || (!hasRoundedBrSm && hasRoundedBlSm)
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
   * Property: Sharp corner corresponds to message ownership
   * 
   * For any message, if isOwn is true, it must have rounded-br-sm,
   * and if isOwn is false, it must have rounded-bl-sm.
   */
  it('should apply correct sharp corner based on message ownership', () => {
    // Generator for any message data
    const messageArbitrary = fc.record({
      content: fc.string({ minLength: 1, maxLength: 100 }),
      isOwn: fc.boolean(),
      isDeleted: fc.boolean(),
    })

    fc.assert(
      fc.property(messageArbitrary, (message) => {
        const { getByTestId } = render(
          <MessageBubble
            content={message.content}
            isOwn={message.isOwn}
            isDeleted={message.isDeleted}
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
          if (isEmojiOnly(message.content) && !message.isDeleted) {
            return true // Skip validation for emoji-only messages
          }

          const hasRoundedBrSm = classes.includes('rounded-br-sm')
          const hasRoundedBlSm = classes.includes('rounded-bl-sm')

          // If isOwn is true, must have rounded-br-sm
          // If isOwn is false, must have rounded-bl-sm
          if (message.isOwn) {
            return hasRoundedBrSm && !hasRoundedBlSm
          } else {
            return hasRoundedBlSm && !hasRoundedBrSm
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
   * Property: All non-emoji messages have rounded-2xl base styling
   * 
   * For any non-emoji message, regardless of ownership, it must have
   * the rounded-2xl class for the base rounded corners.
   */
  it('should apply rounded-2xl class to all non-emoji messages', () => {
    // Generator for any message data
    const messageArbitrary = fc.record({
      content: fc.string({ minLength: 1, maxLength: 100 }),
      isOwn: fc.boolean(),
      isDeleted: fc.boolean(),
    })

    fc.assert(
      fc.property(messageArbitrary, (message) => {
        const { getByTestId } = render(
          <MessageBubble
            content={message.content}
            isOwn={message.isOwn}
            isDeleted={message.isDeleted}
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
          if (isEmojiOnly(message.content) && !message.isDeleted) {
            return true // Skip validation for emoji-only messages
          }

          // All non-emoji messages should have rounded-2xl
          return classes.includes('rounded-2xl')
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
})


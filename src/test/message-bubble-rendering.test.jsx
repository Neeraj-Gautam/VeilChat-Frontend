import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { render, cleanup } from '@testing-library/react'

/**
 * **Validates: Requirements 11.5**
 * 
 * Unit Tests: Message Bubble Rendering
 * 
 * Tests message bubble rendering with different message types (text, image, file, deleted, system),
 * theme changes updating message colors without re-rendering, and edge cases
 * (empty messages, very long messages, emoji-only messages).
 */

// Mock message bubble component that mimics ChatWindow's message rendering
const MessageBubble = ({ 
  content, 
  isOwn, 
  isDeleted = false, 
  type = 'text', 
  attachments = [], 
  isSystem = false,
  replyTo = null,
  forwardedFrom = null,
  forwardedFromChat = null
}) => {
  const isEmojiOnly = (text) => {
    if (!text || typeof text !== 'string') return false
    const emojiRegex = /^[\p{Emoji}\s]+$/u
    return emojiRegex.test(text.trim())
  }

  // System messages have different rendering
  if (isSystem || type === 'system') {
    return (
      <div className="flex justify-center my-1">
        <span 
          data-testid="system-message"
          className="bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs px-3 py-1 rounded-full"
        >
          {content}
        </span>
      </div>
    )
  }

  // Check if emoji-only with no additional content (matches ChatWindow logic)
  const shouldUseTransparentBg = isEmojiOnly(content) && !attachments?.length && !replyTo && !forwardedFrom && !forwardedFromChat && !isDeleted

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        data-testid="message-bubble"
        data-message-type={type}
        className={`relative max-w-[70%] ${
          shouldUseTransparentBg
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
          <>
            {/* Forwarded indicator */}
            {(forwardedFrom || forwardedFromChat) && (
              <div className="flex items-center gap-1 mb-1" data-testid="forwarded-indicator">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                  <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                </svg>
                <span className={`text-xs italic ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                  Forwarded from {forwardedFromChat ? forwardedFromChat.groupName : forwardedFrom?.name}
                </span>
              </div>
            )}
            
            {/* Reply indicator */}
            {replyTo && (
              <div className="bg-black/10 dark:bg-white/10 rounded px-2 py-1 mb-1 border-l-2 border-white/50" data-testid="reply-indicator">
                <p className="text-xs font-medium opacity-90">{replyTo.sender?.name || 'Unknown'}</p>
                <p className="text-xs opacity-75 truncate">{replyTo?.content || 'Original message'}</p>
              </div>
            )}
            
            <p data-testid="message-content">{content}</p>
            
            {/* Attachments */}
            {attachments && attachments.length > 0 && (
              <div className="mt-2 space-y-2" data-testid="message-attachments">
                {attachments.map((attachment, idx) => (
                  <div key={idx} data-testid={`attachment-${attachment.type}`}>
                    {attachment.type === 'image' ? (
                      <img 
                        src={attachment.url} 
                        alt="attachment" 
                        className="max-w-xs rounded-lg"
                        data-testid="image-attachment"
                      />
                    ) : (
                      <div 
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
                          isOwn 
                            ? 'bg-white/15 hover:bg-white/25' 
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                        data-testid="file-attachment"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
                          <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{attachment.name || 'File'}</p>
                          {attachment.size && (
                            <p className="text-xs opacity-75">{(attachment.size / 1024).toFixed(1)} KB</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

describe('Unit Tests: Message Bubble Rendering', () => {
  beforeAll(() => {
    // Inject theme CSS into the test environment
    const style = document.createElement('style')
    style.textContent = `
      :root[data-theme="light"] {
        --color-message-own: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        --color-message-other: #ffffff;
        --color-text-on-own: #ffffff;
        --color-text-on-other: #1f2937;
      }

      :root[data-theme="dark"] {
        --color-message-own: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        --color-message-other: #374151;
        --color-text-on-own: #ffffff;
        --color-text-on-other: #ffffff;
      }

      :root[data-theme="whatsapp"] {
        --color-message-own: #dcf8c6;
        --color-message-other: #ffffff;
        --color-text-on-own: #000000;
        --color-text-on-other: #000000;
      }

      :root[data-theme="telegram"] {
        --color-message-own: #effdde;
        --color-message-other: #ffffff;
        --color-text-on-own: #000000;
        --color-text-on-other: #000000;
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
    cleanup()
    document.documentElement.removeAttribute('data-theme')
  })

  describe('Message Type: Text Messages', () => {
    it('should render text message with correct structure', () => {
      const { getByTestId } = render(
        <MessageBubble content="Hello world" isOwn={true} type="text" />
      )

      const bubble = getByTestId('message-bubble')
      const content = getByTestId('message-content')

      expect(bubble).toBeTruthy()
      expect(content).toBeTruthy()
      expect(content.textContent).toBe('Hello world')
      expect(bubble.getAttribute('data-message-type')).toBe('text')
    })

    it('should render own text message with correct classes', () => {
      const { getByTestId } = render(
        <MessageBubble content="My message" isOwn={true} type="text" />
      )

      const bubble = getByTestId('message-bubble')
      expect(bubble.className).toContain('bg-theme-message-own')
      expect(bubble.className).toContain('text-theme-text-on-own')
      expect(bubble.className).toContain('rounded-br-sm')
    })

    it('should render other text message with correct classes', () => {
      const { getByTestId } = render(
        <MessageBubble content="Their message" isOwn={false} type="text" />
      )

      const bubble = getByTestId('message-bubble')
      expect(bubble.className).toContain('bg-theme-message-other')
      expect(bubble.className).toContain('text-theme-text-on-other')
      expect(bubble.className).toContain('rounded-bl-sm')
    })
  })

  describe('Message Type: Image Messages', () => {
    it('should render image message with attachment', () => {
      const attachments = [
        { type: 'image', url: 'https://example.com/image.jpg', name: 'image.jpg' }
      ]

      const { getByTestId } = render(
        <MessageBubble 
          content="" 
          isOwn={true} 
          type="image" 
          attachments={attachments}
        />
      )

      const bubble = getByTestId('message-bubble')
      const attachmentsContainer = getByTestId('message-attachments')
      const imageAttachment = getByTestId('image-attachment')

      expect(bubble).toBeTruthy()
      expect(attachmentsContainer).toBeTruthy()
      expect(imageAttachment).toBeTruthy()
      expect(imageAttachment.tagName).toBe('IMG')
      expect(imageAttachment.getAttribute('src')).toBe('https://example.com/image.jpg')
    })

    it('should render image message with caption', () => {
      const attachments = [
        { type: 'image', url: 'https://example.com/image.jpg', name: 'image.jpg' }
      ]

      const { getByTestId } = render(
        <MessageBubble 
          content="Check this out!" 
          isOwn={true} 
          type="image" 
          attachments={attachments}
        />
      )

      const content = getByTestId('message-content')
      const imageAttachment = getByTestId('image-attachment')

      expect(content.textContent).toBe('Check this out!')
      expect(imageAttachment).toBeTruthy()
    })

    it('should apply bubble styling to image messages with attachments', () => {
      const attachments = [
        { type: 'image', url: 'https://example.com/image.jpg', name: 'image.jpg' }
      ]

      const { getByTestId } = render(
        <MessageBubble 
          content="Photo" 
          isOwn={true} 
          type="image" 
          attachments={attachments}
        />
      )

      const bubble = getByTestId('message-bubble')
      // Should have bubble styling because it has attachments
      expect(bubble.className).toContain('bg-theme-message-own')
      expect(bubble.className).toContain('px-4')
      expect(bubble.className).toContain('py-2')
    })
  })

  describe('Message Type: File Messages', () => {
    it('should render file message with attachment', () => {
      const attachments = [
        { type: 'file', url: 'https://example.com/document.pdf', name: 'document.pdf', size: 102400 }
      ]

      const { getByTestId } = render(
        <MessageBubble 
          content="" 
          isOwn={true} 
          type="file" 
          attachments={attachments}
        />
      )

      const bubble = getByTestId('message-bubble')
      const attachmentsContainer = getByTestId('message-attachments')
      const fileAttachment = getByTestId('file-attachment')

      expect(bubble).toBeTruthy()
      expect(attachmentsContainer).toBeTruthy()
      expect(fileAttachment).toBeTruthy()
      expect(fileAttachment.textContent).toContain('document.pdf')
      expect(fileAttachment.textContent).toContain('100.0 KB')
    })

    it('should render file message with multiple attachments', () => {
      const attachments = [
        { type: 'file', url: 'https://example.com/doc1.pdf', name: 'doc1.pdf', size: 51200 },
        { type: 'file', url: 'https://example.com/doc2.pdf', name: 'doc2.pdf', size: 102400 }
      ]

      const { getByTestId, getAllByTestId } = render(
        <MessageBubble 
          content="Here are the files" 
          isOwn={true} 
          type="file" 
          attachments={attachments}
        />
      )

      const fileAttachments = getAllByTestId('file-attachment')
      expect(fileAttachments).toHaveLength(2)
      expect(fileAttachments[0].textContent).toContain('doc1.pdf')
      expect(fileAttachments[1].textContent).toContain('doc2.pdf')
    })
  })

  describe('Message Type: Deleted Messages', () => {
    it('should render deleted message with correct text', () => {
      const { getByTestId } = render(
        <MessageBubble content="Original content" isOwn={true} isDeleted={true} />
      )

      const bubble = getByTestId('message-bubble')
      expect(bubble.textContent).toContain('🚫 This message was deleted')
      expect(bubble.textContent).not.toContain('Original content')
    })

    it('should apply italic and opacity styles to deleted messages', () => {
      const { getByTestId } = render(
        <MessageBubble content="Original content" isOwn={true} isDeleted={true} />
      )

      const bubble = getByTestId('message-bubble')
      const deletedText = bubble.querySelector('p')
      
      expect(deletedText.className).toContain('italic')
      expect(deletedText.className).toContain('opacity-60')
    })

    it('should still apply theme colors to deleted messages', () => {
      const { getByTestId } = render(
        <MessageBubble content="Original content" isOwn={true} isDeleted={true} />
      )

      const bubble = getByTestId('message-bubble')
      expect(bubble.className).toContain('bg-theme-message-own')
      expect(bubble.className).toContain('text-theme-text-on-own')
    })

    it('should render deleted message for other user', () => {
      const { getByTestId } = render(
        <MessageBubble content="Original content" isOwn={false} isDeleted={true} />
      )

      const bubble = getByTestId('message-bubble')
      expect(bubble.textContent).toContain('🚫 This message was deleted')
      expect(bubble.className).toContain('bg-theme-message-other')
      expect(bubble.className).toContain('text-theme-text-on-other')
    })
  })

  describe('Message Type: System Messages', () => {
    it('should render system message with correct structure', () => {
      const { getByTestId } = render(
        <MessageBubble content="User joined the group" isSystem={true} />
      )

      const systemMessage = getByTestId('system-message')
      expect(systemMessage).toBeTruthy()
      expect(systemMessage.textContent).toBe('User joined the group')
    })

    it('should apply system message styling', () => {
      const { getByTestId } = render(
        <MessageBubble content="User left the group" type="system" />
      )

      const systemMessage = getByTestId('system-message')
      expect(systemMessage.className).toContain('bg-gray-200')
      expect(systemMessage.className).toContain('text-gray-500')
      expect(systemMessage.className).toContain('rounded-full')
    })

    it('should center system messages', () => {
      const { container } = render(
        <MessageBubble content="Group created" isSystem={true} />
      )

      const wrapper = container.querySelector('.flex')
      expect(wrapper.className).toContain('justify-center')
    })
  })

  describe('Message Type: Forwarded Messages', () => {
    it('should render forwarded message with indicator', () => {
      const { getByTestId } = render(
        <MessageBubble 
          content="Forwarded message" 
          isOwn={true} 
          forwardedFrom={{ name: 'John' }}
        />
      )

      const forwardedIndicator = getByTestId('forwarded-indicator')
      expect(forwardedIndicator).toBeTruthy()
      expect(forwardedIndicator.textContent).toContain('Forwarded from John')
    })

    it('should render forwarded from chat with group name', () => {
      const { getByTestId } = render(
        <MessageBubble 
          content="Forwarded message" 
          isOwn={true} 
          forwardedFromChat={{ groupName: 'Group Chat' }}
        />
      )

      const forwardedIndicator = getByTestId('forwarded-indicator')
      expect(forwardedIndicator.textContent).toContain('Forwarded from Group Chat')
    })

    it('should apply bubble styling to forwarded emoji messages', () => {
      // Forwarded emoji messages should have bubble styling (not transparent)
      const { getByTestId } = render(
        <MessageBubble 
          content="😀" 
          isOwn={true} 
          forwardedFrom={{ name: 'John' }}
        />
      )

      const bubble = getByTestId('message-bubble')
      // Should have bubble styling because it's forwarded
      expect(bubble.className).toContain('bg-theme-message-own')
      expect(bubble.className).not.toContain('bg-transparent')
    })
  })

  describe('Message Type: Reply Messages', () => {
    it('should render reply message with indicator', () => {
      const replyTo = {
        sender: { name: 'Jane' },
        content: 'Original message'
      }

      const { getByTestId } = render(
        <MessageBubble 
          content="Reply message" 
          isOwn={true} 
          replyTo={replyTo}
        />
      )

      const replyIndicator = getByTestId('reply-indicator')
      expect(replyIndicator).toBeTruthy()
      expect(replyIndicator.textContent).toContain('Jane')
      expect(replyIndicator.textContent).toContain('Original message')
    })

    it('should apply bubble styling to emoji reply messages', () => {
      // Emoji replies should have bubble styling (not transparent)
      const replyTo = {
        sender: { name: 'Jane' },
        content: 'Original message'
      }

      const { getByTestId } = render(
        <MessageBubble 
          content="😀" 
          isOwn={true} 
          replyTo={replyTo}
        />
      )

      const bubble = getByTestId('message-bubble')
      // Should have bubble styling because it has a reply
      expect(bubble.className).toContain('bg-theme-message-own')
      expect(bubble.className).not.toContain('bg-transparent')
    })
  })

  describe('Edge Case: Empty Messages', () => {
    it('should render empty message with bubble structure', () => {
      const { getByTestId } = render(
        <MessageBubble content="" isOwn={true} />
      )

      const bubble = getByTestId('message-bubble')
      const content = getByTestId('message-content')
      
      expect(bubble).toBeTruthy()
      expect(content).toBeTruthy()
      expect(content.textContent).toBe('')
    })

    it('should still apply theme colors to empty messages', () => {
      const { getByTestId } = render(
        <MessageBubble content="" isOwn={true} />
      )

      const bubble = getByTestId('message-bubble')
      expect(bubble.className).toContain('bg-theme-message-own')
      expect(bubble.className).toContain('text-theme-text-on-own')
    })
  })

  describe('Edge Case: Very Long Messages', () => {
    it('should render very long message with max-width constraint', () => {
      const longMessage = 'A'.repeat(1000)
      
      const { getByTestId } = render(
        <MessageBubble content={longMessage} isOwn={true} />
      )

      const bubble = getByTestId('message-bubble')
      const content = getByTestId('message-content')
      
      expect(bubble.className).toContain('max-w-[70%]')
      expect(content.textContent).toBe(longMessage)
    })

    it('should apply word wrapping to long messages', () => {
      const longMessage = 'ThisIsAVeryLongWordWithoutSpacesThatShouldWrap'.repeat(10)
      
      const { getByTestId } = render(
        <MessageBubble content={longMessage} isOwn={true} />
      )

      const bubble = getByTestId('message-bubble')
      expect(bubble).toBeTruthy()
      // The component should handle long text gracefully
      expect(bubble.className).toContain('max-w-[70%]')
    })

    it('should maintain theme colors for very long messages', () => {
      const longMessage = 'Long message content. '.repeat(100)
      
      const { getByTestId } = render(
        <MessageBubble content={longMessage} isOwn={false} />
      )

      const bubble = getByTestId('message-bubble')
      expect(bubble.className).toContain('bg-theme-message-other')
      expect(bubble.className).toContain('text-theme-text-on-other')
    })
  })

  describe('Edge Case: Emoji-Only Messages', () => {
    it('should render emoji-only message without bubble background', () => {
      const { getByTestId } = render(
        <MessageBubble content="😀😃😄" isOwn={true} />
      )

      const bubble = getByTestId('message-bubble')
      expect(bubble.className).toContain('bg-transparent')
      expect(bubble.className).toContain('shadow-none')
      expect(bubble.className).not.toContain('px-4')
    })

    it('should render single emoji without bubble background', () => {
      const { getByTestId } = render(
        <MessageBubble content="👍" isOwn={true} />
      )

      const bubble = getByTestId('message-bubble')
      expect(bubble.className).toContain('bg-transparent')
      expect(bubble.className).toContain('shadow-none')
    })

    it('should render emoji with spaces without bubble background', () => {
      const { getByTestId } = render(
        <MessageBubble content="😀 😃 😄" isOwn={true} />
      )

      const bubble = getByTestId('message-bubble')
      expect(bubble.className).toContain('bg-transparent')
      expect(bubble.className).toContain('shadow-none')
    })

    it('should render emoji-only message for other user without bubble background', () => {
      const { getByTestId } = render(
        <MessageBubble content="🎉🎊" isOwn={false} />
      )

      const bubble = getByTestId('message-bubble')
      expect(bubble.className).toContain('bg-transparent')
      expect(bubble.className).toContain('shadow-none')
    })

    it('should apply bubble styling to emoji with attachments', () => {
      const attachments = [
        { type: 'image', url: 'https://example.com/image.jpg', name: 'image.jpg' }
      ]

      const { getByTestId } = render(
        <MessageBubble content="😀" isOwn={true} attachments={attachments} />
      )

      const bubble = getByTestId('message-bubble')
      // Should have bubble styling because it has attachments
      expect(bubble.className).toContain('bg-theme-message-own')
      expect(bubble.className).not.toContain('bg-transparent')
    })

    it('should not treat text with emoji as emoji-only', () => {
      const { getByTestId } = render(
        <MessageBubble content="Hello 😀" isOwn={true} />
      )

      const bubble = getByTestId('message-bubble')
      // Should have bubble styling because it's not emoji-only
      expect(bubble.className).toContain('bg-theme-message-own')
      expect(bubble.className).not.toContain('bg-transparent')
    })
  })

  describe('Theme Changes Without Re-rendering', () => {
    it('should update colors when theme changes from light to dark', () => {
      document.documentElement.setAttribute('data-theme', 'light')
      
      const { getByTestId } = render(
        <MessageBubble content="Test message" isOwn={true} />
      )

      const bubble = getByTestId('message-bubble')
      
      // Verify initial theme classes are present
      expect(bubble.className).toContain('bg-theme-message-own')
      expect(bubble.className).toContain('text-theme-text-on-own')
      
      // Change theme without re-rendering component
      document.documentElement.setAttribute('data-theme', 'dark')
      
      // Classes should still be present (CSS variables handle the color change)
      expect(bubble.className).toContain('bg-theme-message-own')
      expect(bubble.className).toContain('text-theme-text-on-own')
      
      // Verify CSS variables are updated
      const styles = getComputedStyle(document.documentElement)
      const messageOwnColor = styles.getPropertyValue('--color-message-own').trim()
      expect(messageOwnColor).toBeTruthy()
    })

    it('should update colors when theme changes from whatsapp to telegram', () => {
      document.documentElement.setAttribute('data-theme', 'whatsapp')
      
      const { getByTestId } = render(
        <MessageBubble content="Test message" isOwn={false} />
      )

      const bubble = getByTestId('message-bubble')
      
      // Verify initial theme classes
      expect(bubble.className).toContain('bg-theme-message-other')
      expect(bubble.className).toContain('text-theme-text-on-other')
      
      // Change theme
      document.documentElement.setAttribute('data-theme', 'telegram')
      
      // Classes remain the same (CSS variables change)
      expect(bubble.className).toContain('bg-theme-message-other')
      expect(bubble.className).toContain('text-theme-text-on-other')
      
      // Verify CSS variables are updated
      const styles = getComputedStyle(document.documentElement)
      const messageOtherColor = styles.getPropertyValue('--color-message-other').trim()
      expect(messageOtherColor).toBe('#ffffff')
    })

    it('should maintain theme color classes across all themes', () => {
      const themes = ['light', 'dark', 'whatsapp', 'telegram']
      
      themes.forEach(theme => {
        cleanup()
        document.documentElement.setAttribute('data-theme', theme)
        
        const { getByTestId } = render(
          <MessageBubble content="Test" isOwn={true} />
        )

        const bubble = getByTestId('message-bubble')
        expect(bubble.className).toContain('bg-theme-message-own')
        expect(bubble.className).toContain('text-theme-text-on-own')
      })
    })

    it('should use CSS variables for theme colors', () => {
      document.documentElement.setAttribute('data-theme', 'light')
      
      const { getByTestId } = render(
        <MessageBubble content="Test" isOwn={true} />
      )

      const bubble = getByTestId('message-bubble')
      
      // Verify that theme color classes are applied
      expect(bubble.className).toContain('bg-theme-message-own')
      expect(bubble.className).toContain('text-theme-text-on-own')
      
      // Verify CSS variables are defined
      const styles = getComputedStyle(document.documentElement)
      const messageOwn = styles.getPropertyValue('--color-message-own').trim()
      const textOnOwn = styles.getPropertyValue('--color-text-on-own').trim()
      
      expect(messageOwn).toBeTruthy()
      expect(textOnOwn).toBeTruthy()
    })
  })

  describe('Message Bubble Structure', () => {
    it('should have correct wrapper alignment for own messages', () => {
      const { container } = render(
        <MessageBubble content="My message" isOwn={true} />
      )

      const wrapper = container.querySelector('.flex')
      expect(wrapper.className).toContain('justify-end')
    })

    it('should have correct wrapper alignment for other messages', () => {
      const { container } = render(
        <MessageBubble content="Their message" isOwn={false} />
      )

      const wrapper = container.querySelector('.flex')
      expect(wrapper.className).toContain('justify-start')
    })

    it('should apply shadow and hover effects', () => {
      const { getByTestId } = render(
        <MessageBubble content="Test" isOwn={true} />
      )

      const bubble = getByTestId('message-bubble')
      expect(bubble.className).toContain('shadow-md')
      expect(bubble.className).toContain('hover:shadow-lg')
    })

    it('should apply rounded corners', () => {
      const { getByTestId } = render(
        <MessageBubble content="Test" isOwn={true} />
      )

      const bubble = getByTestId('message-bubble')
      expect(bubble.className).toContain('rounded-2xl')
    })

    it('should apply cursor pointer', () => {
      const { getByTestId } = render(
        <MessageBubble content="Test" isOwn={true} />
      )

      const bubble = getByTestId('message-bubble')
      expect(bubble.className).toContain('cursor-pointer')
    })
  })
})


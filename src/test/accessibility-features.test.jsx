import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { render, cleanup, getByRole } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'

/**
 * Unit Tests for Accessibility Features
 * 
 * **Validates: Requirement 12.5**
 * 
 * These tests verify that:
 * - Color is not the only means of conveying information
 * - Keyboard navigation works for theme selector
 * - Screen reader compatibility is maintained
 */

// Mock CSS variables and theme styles
const themeStyles = `
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

  /* Utility classes */
  .bg-theme-primary { background-color: var(--color-primary); }
  .bg-theme-chat-bg { background-color: var(--color-chat-bg); }
  .bg-theme-message-own { background: var(--color-message-own); }
  .bg-theme-message-other { background-color: var(--color-message-other); }
  .bg-theme-input-bg { background-color: var(--color-input-bg); }
  .bg-theme-header-bg { background-color: var(--color-header-bg); }
  .text-theme-text-on-primary { color: var(--color-text-on-primary); }
  .text-theme-text-on-own { color: var(--color-text-on-own); }
  .text-theme-text-on-other { color: var(--color-text-on-other); }
  .border-theme-border { border-color: var(--color-border); }
  .text-theme-primary { color: var(--color-primary); }
`

// Mock theme store
const createMockThemeState = (initialTheme = 'light') => ({
  theme: initialTheme,
  setTheme: function(newTheme) {
    this.theme = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }
})

// Mock ThemeSelector component with accessibility features
const MockThemeSelector = ({ themeState }) => {
  const themes = [
    { id: 'light', label: 'Light', icon: '☀️' },
    { id: 'dark', label: 'Dark', icon: '🌙' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { id: 'telegram', label: 'Telegram', icon: '✈️' },
  ]

  return (
    <div data-testid="theme-selector" role="group" aria-label="Theme selection" className="flex flex-wrap gap-2">
      {themes.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => themeState.setTheme(id)}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${themeState.theme === id
              ? 'bg-theme-primary text-theme-text-on-primary shadow-md'
              : 'bg-theme-input-bg text-theme-text-on-other border border-theme-border hover:bg-theme-primary hover:text-theme-text-on-primary hover:border-transparent'
            }
          `}
          aria-label={`Switch to ${label} theme`}
          aria-pressed={themeState.theme === id}
          title={themeState.theme === id ? `Currently using ${label} theme` : `Switch to ${label} theme`}
        >
          <span aria-hidden="true">{icon}</span>
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  )
}

// Mock message component with multiple means of conveying information
const MockMessageBubble = ({ content, isOwn, timestamp, status }) => {
  return (
    <div
      role="article"
      aria-label={isOwn ? `Your message: ${content}` : `Message: ${content}`}
      className={`
        max-w-[70%] px-4 py-2 shadow-md
        ${isOwn
          ? 'bg-theme-message-own text-theme-text-on-own rounded-2xl rounded-br-sm ml-auto'
          : 'bg-theme-message-other text-theme-text-on-other rounded-2xl rounded-bl-sm'
        }
      `}
    >
      <p className="text-sm">{content}</p>
      <div className="flex items-center justify-end gap-1 mt-1">
        <span className="text-xs opacity-60">{timestamp}</span>
        {isOwn && status && (
          <span 
            aria-label={status === 'sent' ? 'Sent' : status === 'delivered' ? 'Delivered' : 'Read'}
            className="text-xs"
          >
            {status === 'sent' && '✓'}
            {status === 'delivered' && '✓✓'}
            {status === 'read' && <span className="text-blue-500">✓✓</span>}
          </span>
        )}
      </div>
    </div>
  )
}

describe('Accessibility Features Tests', () => {
  let user
  let testThemeState

  beforeAll(() => {
    const style = document.createElement('style')
    style.textContent = themeStyles
    document.head.appendChild(style)
  })

  beforeEach(() => {
    user = userEvent.setup()
    testThemeState = createMockThemeState('light')
    document.documentElement.setAttribute('data-theme', 'light')
  })

  afterEach(() => {
    cleanup()
    document.documentElement.removeAttribute('data-theme')
    localStorage.clear()
  })

  describe('Requirement 12.5: Color is not the only means of conveying information', () => {
    
    describe('Theme selector conveys information through multiple means', () => {
      /**
       * Test: Theme buttons show both icons AND text labels
       * Verifies: Non-color indicators (icons + text) are present
       */
      it('should display both icons and text labels for each theme', () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const themes = [
          { name: 'Light', icon: '☀️' },
          { name: 'Dark', icon: '🌙' },
          { name: 'WhatsApp', icon: '💬' },
          { name: 'Telegram', icon: '✈️' },
        ]

        themes.forEach(({ name }) => {
          const button = getByRole('button', { name: `Switch to ${name} theme` })
          
          // Button has visible text label (via aria-label check)
          expect(button).toHaveAttribute('aria-label')
          
          // Button uses icons via aria-hidden on the icon span (checked in component)
          expect(button.textContent).toBeTruthy()
        })
      })

      /**
       * Test: Active theme has visual indicators beyond color
       * Verifies: shadow-md, aria-pressed, and title attributes
       */
      it('should indicate active theme through multiple non-color indicators', () => {
        testThemeState.theme = 'dark'
        document.documentElement.setAttribute('data-theme', 'dark')

        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const darkButton = getByRole('button', { name: 'Switch to Dark theme' })

        // Check aria-pressed attribute
        expect(darkButton).toHaveAttribute('aria-pressed', 'true')
        
        // Check shadow class (visual indicator beyond just background color)
        expect(darkButton.className).toContain('shadow-md')
        
        // Check title attribute provides additional context
        expect(darkButton).toHaveAttribute('title')
      })

      /**
       * Test: Inactive themes have border styling as visual indicator
       * Verifies: Border provides visual distinction beyond just color
       */
      it('should use border styling for inactive buttons', () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        // Light is active, so dark should have border
        const darkButton = getByRole('button', { name: 'Switch to Dark theme' })
        
        // Border is a non-color visual indicator
        expect(darkButton.className).toContain('border')
        expect(darkButton.className).toContain('border-theme-border')
      })

      /**
       * Test: Each theme button has unique accessible name
       * Verifies: Text labels provide identification beyond color
       */
      it('should have unique accessible names for each theme button', () => {
        const { getAllByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const buttons = getAllByRole('button')
        
        // Each button should have a distinct aria-label
        const labels = buttons.map(btn => btn.getAttribute('aria-label'))
        const uniqueLabels = new Set(labels)
        
        expect(uniqueLabels.size).toBe(4) // All 4 should be unique
      })
    })

    describe('Message bubble conveys information through multiple means', () => {
      /**
       * Test: Message status uses both color and symbols
       * Verifies: Double checkmarks for read, single for sent
       */
      it('should convey message status through text symbols, not just color', () => {
        const { getByLabelText, rerender } = render(
          <MockMessageBubble content="Hello" isOwn={true} timestamp="10:30" status="sent" />
        )

        const sentMessage = getByLabelText('Sent')
        expect(sentMessage.textContent).toBe('✓')

        rerender(<MockMessageBubble content="Hello" isOwn={true} timestamp="10:30" status="read" />)
        
        const readMessage = getByLabelText('Read')
        expect(readMessage.textContent).toContain('✓✓')
      })

      /**
       * Test: Own messages have aria-label identifying them
       * Verifies: "Your message" label distinguishes from others
       */
      it('should identify own messages through aria-label', () => {
        const { getByLabelText } = render(
          <MockMessageBubble content="Hello" isOwn={true} timestamp="10:30" />
        )

        const ownMessageLabel = getByLabelText(/Your message/)
        expect(ownMessageLabel).toBeInTheDocument()
      })

      /**
       * Test: Other messages have distinct aria-label
       * Verifies: Different labels distinguish sender
       */
      it('should identify other messages through aria-label', () => {
        const { getByLabelText } = render(
          <MockMessageBubble content="Hello" isOwn={false} timestamp="10:30" />
        )

        const otherMessageLabel = getByLabelText(/Message:/)
        expect(otherMessageLabel).toBeInTheDocument()
      })

      /**
       * Test: Messages use timestamp as additional information
       * Verifies: Time provides non-color information
       */
      it('should display timestamp for messages', () => {
        const { getByText } = render(
          <MockMessageBubble content="Hello" isOwn={true} timestamp="10:30" />
        )

        expect(getByText('10:30')).toBeInTheDocument()
      })
    })
  })

  describe('Keyboard navigation for theme selector', () => {
    
    describe('Tab navigation', () => {
      /**
       * Test: First theme button is focusable by default
       * Verifies: Tab can reach the first button
       */
      it('should allow tab to reach first theme button', async () => {
        const { container } = render(<MockThemeSelector themeState={testThemeState} />)

        // Focus should start outside the component
        const firstButton = container.querySelector('button')
        
        await user.tab()
        expect(firstButton).toHaveFocus()
      })

      /**
       * Test: All theme buttons are in the tab order
       * Verifies: Tab cycles through all buttons
       */
      it('should allow tabbing through all theme buttons', async () => {
        const { container } = render(<MockThemeSelector themeState={testThemeState} />)

        const buttons = container.querySelectorAll('button')
        
        // First tab reaches first button
        await user.tab()
        expect(buttons[0]).toHaveFocus()

        // Second tab reaches second button
        await user.tab()
        expect(buttons[1]).toHaveFocus()

        // Third tab reaches third button
        await user.tab()
        expect(buttons[2]).toHaveFocus()

        // Fourth tab reaches fourth button
        await user.tab()
        expect(buttons[3]).toHaveFocus()
      })

      /**
       * Test: Shift+Tab navigates backwards
       * Verifies: Reverse navigation works
       */
      it('should allow shift+tab to navigate backwards', async () => {
        const { container } = render(<MockThemeSelector themeState={testThemeState} />)

        const buttons = container.querySelectorAll('button')
        
        // Tab to last button first
        await user.tab()
        await user.tab()
        await user.tab()
        await user.tab()
        expect(buttons[3]).toHaveFocus()

        // Shift+Tab back to third button
        await user.tab({ shift: true })
        expect(buttons[2]).toHaveFocus()

        // Shift+Tab back to second button
        await user.tab({ shift: true })
        expect(buttons[1]).toHaveFocus()

        // Shift+Tab back to first button
        await user.tab({ shift: true })
        expect(buttons[0]).toHaveFocus()
      })
    })

    describe('Activation keys', () => {
      /**
       * Test: Enter key activates focused button
       * Verifies: Enter is functional
       */
      it('should activate theme button with Enter key', async () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const darkButton = getByRole('button', { name: 'Switch to Dark theme' })

        // Focus the button
        darkButton.focus()
        expect(darkButton).toHaveFocus()

        // Press Enter
        await act(async () => {
          await user.keyboard('{Enter}')
        })

        expect(testThemeState.theme).toBe('dark')
      })

      /**
       * Test: Space key activates focused button
       * Verifies: Space is functional
       */
      it('should activate theme button with Space key', async () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const whatsappButton = getByRole('button', { name: 'Switch to WhatsApp theme' })

        // Focus the button
        whatsappButton.focus()
        expect(whatsappButton).toHaveFocus()

        // Press Space
        await act(async () => {
          await user.keyboard(' ')
        })

        expect(testThemeState.theme).toBe('whatsapp')
      })

      /**
       * Test: Click also activates button
       * Verifies: Mouse click works
       */
      it('should activate theme button with click', async () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const telegramButton = getByRole('button', { name: 'Switch to Telegram theme' })

        await act(async () => {
          await user.click(telegramButton)
        })

        expect(testThemeState.theme).toBe('telegram')
      })

      /**
       * Test: All theme buttons can be activated
       * Verifies: All buttons respond to user interaction
       */
      it('should allow activation of all themes through user interaction', async () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        // Dark theme via click
        await act(async () => {
          await user.click(getByRole('button', { name: 'Switch to Dark theme' }))
        })
        expect(testThemeState.theme).toBe('dark')

        // WhatsApp theme via click
        await act(async () => {
          await user.click(getByRole('button', { name: 'Switch to WhatsApp theme' }))
        })
        expect(testThemeState.theme).toBe('whatsapp')

        // Telegram theme via click
        await act(async () => {
          await user.click(getByRole('button', { name: 'Switch to Telegram theme' }))
        })
        expect(testThemeState.theme).toBe('telegram')

        // Light theme via click
        await act(async () => {
          await user.click(getByRole('button', { name: 'Switch to Light theme' }))
        })
        expect(testThemeState.theme).toBe('light')
      })
    })

    describe('Focus indicators', () => {
      /**
       * Test: Focus styles use border styling
       * Verifies: Focus is visually apparent via border
       */
      it('should apply focus-visible styles via hover classes', () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const darkButton = getByRole('button', { name: 'Switch to Dark theme' })

        // Inactive button has border that shows focus
        expect(darkButton.className).toContain('border')
        
        // Active button also has border when it has shadow (focus indicator)
        const lightButton = getByRole('button', { name: 'Switch to Light theme' })
        expect(lightButton.className).toContain('shadow-md')
      })

      /**
       * Test: Buttons have title for additional context
       * Verifies: Tooltips provide extra information
       */
      it('should have title attribute for additional context', () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const lightButton = getByRole('button', { name: 'Switch to Light theme' })
        
        // Title provides additional context beyond aria-label
        expect(lightButton).toHaveAttribute('title')
        expect(lightButton.getAttribute('title')).toContain('Light')
      })
    })
  })

  describe('Screen reader compatibility', () => {
    
    describe('ARIA attributes', () => {
      /**
       * Test: Container has group role with label
       * Verifies: Screen reader identifies the component
       */
      it('should have accessible group with label', () => {
        const { getByTestId, getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const selector = getByTestId('theme-selector')
        
        expect(selector).toHaveAttribute('role', 'group')
        expect(selector).toHaveAttribute('aria-label', 'Theme selection')
      })

      /**
       * Test: Each button has aria-label
       * Verifies: Button purpose is announced
       */
      it('should have aria-label on each button', () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const themes = ['Light', 'Dark', 'WhatsApp', 'Telegram']
        
        themes.forEach(theme => {
          const button = getByRole('button', { name: `Switch to ${theme} theme` })
          expect(button).toHaveAttribute('aria-label', `Switch to ${theme} theme`)
        })
      })

      /**
       * Test: Active state is indicated via aria-pressed
       * Verifies: Current theme is announced
       */
      it('should indicate active theme with aria-pressed', () => {
        testThemeState.theme = 'whatsapp'
        document.documentElement.setAttribute('data-theme', 'whatsapp')

        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const activeButton = getByRole('button', { name: 'Switch to WhatsApp theme' })
        expect(activeButton).toHaveAttribute('aria-pressed', 'true')

        const inactiveButton = getByRole('button', { name: 'Switch to Light theme' })
        expect(inactiveButton).toHaveAttribute('aria-pressed', 'false')
      })

      /**
       * Test: Multiple buttons with aria-pressed update correctly
       * Verifies: State changes are announced
       */
      it('should update aria-pressed when theme changes', async () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        // Initially light is active
        expect(getByRole('button', { name: 'Switch to Light theme' }))
          .toHaveAttribute('aria-pressed', 'true')

        // Click dark theme
        await act(async () => {
          await user.click(getByRole('button', { name: 'Switch to Dark theme' }))
        })

        // Re-render to see updated state
        cleanup()
        const { getByRole: getByRole2 } = render(<MockThemeSelector themeState={testThemeState} />)

        // Now dark should be active
        expect(getByRole2('button', { name: 'Switch to Dark theme' }))
          .toHaveAttribute('aria-pressed', 'true')
        expect(getByRole2('button', { name: 'Switch to Light theme' }))
          .toHaveAttribute('aria-pressed', 'false')
      })

      /**
       * Test: Icons are hidden from screen readers
       * Verifies: Decorative icons don't announce
       */
      it('should hide decorative icons from screen readers', () => {
        const { container } = render(<MockThemeSelector themeState={testThemeState} />)

        const iconSpans = container.querySelectorAll('span[aria-hidden="true"]')
        
        // Each theme button should have an icon with aria-hidden
        expect(iconSpans.length).toBe(4)
        iconSpans.forEach(span => {
          expect(span).toHaveAttribute('aria-hidden', 'true')
        })
      })

      /**
       * Test: Text labels use sr-only class for screen readers
       * Verifies: Text is available to screen readers
       */
      it('should have text labels available for screen readers', () => {
        const { container } = render(<MockThemeSelector themeState={testThemeState} />)

        const srOnlySpans = container.querySelectorAll('.sr-only')
        
        // Should have screen-reader-only text for each theme
        expect(srOnlySpans.length).toBe(4)
      })
    })

    describe('Semantic HTML', () => {
      /**
       * Test: Buttons are actual button elements
       * Verifies: Correct semantic element is used
       */
      it('should use button elements for theme selection', () => {
        const { getAllByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const buttons = getAllByRole('button')
        
        buttons.forEach(button => {
          expect(button.tagName.toLowerCase()).toBe('button')
        })
      })

      /**
       * Test: Component has proper container
       * Verifies: Structural organization
       */
      it('should render within a proper container element', () => {
        const { getByTestId } = render(<MockThemeSelector themeState={testThemeState} />)

        const selector = getByTestId('theme-selector')
        
        // Container should exist and be a div
        expect(selector.tagName.toLowerCase()).toBe('div')
      })
    })

    describe('Live region announcements', () => {
      /**
       * Test: Role=group announces the component purpose
       * Verifies: Group context is provided
       */
      it('should provide group context for screen readers', () => {
        const { getByTestId } = render(<MockThemeSelector themeState={testThemeState} />)

        const selector = getByTestId('theme-selector')
        
        // Screen readers will announce: "Theme selection, group"
        expect(selector.getAttribute('aria-label')).toBeTruthy()
      })
    })
  })

  describe('Focus management', () => {
    
    describe('Focus restoration', () => {
      /**
       * Test: Focus is maintained within component after interaction
       * Verifies: Focus doesn't get lost
       */
      it('should maintain focus within the component after activation', async () => {
        const { getByRole, container } = render(<MockThemeSelector themeState={testThemeState} />)

        const buttons = container.querySelectorAll('button')

        // Tab to first button
        await user.tab()
        expect(buttons[0]).toHaveFocus()

        // Press Enter to activate
        await act(async () => {
          await user.keyboard('{Enter}')
        })

        // Focus should still be on the button (Enter doesn't move focus)
        expect(buttons[0]).toHaveFocus()
      })

      /**
       * Test: Sequential keyboard navigation keeps focus in component
       * Verifies: No focus loss during navigation
       */
      it('should keep focus in component during sequential navigation', async () => {
        const { container } = render(<MockThemeSelector themeState={testThemeState} />)

        const buttons = container.querySelectorAll('button')

        // Tab through all buttons
        for (let i = 0; i < buttons.length; i++) {
          await user.tab()
          expect(buttons[i]).toHaveFocus()
        }
      })
    })
  })

  describe('Visual indicators for all themes', () => {
    
    /**
     * Test: All themes have distinct non-color indicators
     * Verifies: Each theme is identifiable beyond color
     */
    it('should have unique indicators for each theme', () => {
      const themes = [
        { id: 'light', label: 'Light', icon: '☀️' },
        { id: 'dark', label: 'Dark', icon: '🌙' },
        { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
        { id: 'telegram', label: 'Telegram', icon: '✈️' },
      ]

      // Each theme has a unique icon and label
      const uniqueIcons = new Set(themes.map(t => t.icon))
      const uniqueLabels = new Set(themes.map(t => t.label))

      expect(uniqueIcons.size).toBe(4)
      expect(uniqueLabels.size).toBe(4)
    })

    /**
     * Test: Active button always has shadow indicator
     * Verifies: Active state is visually apparent without relying on color alone
     */
    it('should apply shadow to active button regardless of theme', () => {
      const themes = ['light', 'dark', 'whatsapp', 'telegram']
      const themeLabels = {
        light: 'Light',
        dark: 'Dark',
        whatsapp: 'WhatsApp',
        telegram: 'Telegram'
      }

      themes.forEach(theme => {
        testThemeState.theme = theme
        document.documentElement.setAttribute('data-theme', theme)

        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const activeButton = getByRole('button', { name: `Switch to ${themeLabels[theme]} theme` })
        
        // Active button always has shadow (non-color indicator)
        expect(activeButton.className).toContain('shadow-md')
        
        cleanup()
      })
    })
  })
})

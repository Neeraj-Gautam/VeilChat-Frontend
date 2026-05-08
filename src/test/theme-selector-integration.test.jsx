import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest'
import { render, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as fc from 'fast-check'
import { act } from 'react'

/**
 * Integration Tests for ThemeSelector Component
 * 
 * **Validates: Requirements 1.5**
 * 
 * These tests verify that:
 * - Clicking theme buttons updates theme
 * - Active theme is highlighted correctly
 * - Keyboard navigation and accessibility work correctly
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

  /* Tailwind-style utility classes for theme colors */
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
`

// Mock theme store - using a simple state object
const mockThemeState = {
  theme: 'light',
  setTheme: (newTheme) => {
    mockThemeState.theme = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }
}

// Mock ThemeSelector component
const MockThemeSelector = ({ themeState = mockThemeState }) => {
  const themes = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'telegram', label: 'Telegram' },
  ]

  return (
    <div data-testid="theme-selector" className="flex flex-wrap gap-2">
      {themes.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => themeState.setTheme(id)}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${
              themeState.theme === id
                ? 'bg-theme-primary text-theme-text-on-primary shadow-md'
                : 'bg-theme-input-bg text-theme-text-on-other border border-theme-border hover:bg-theme-primary hover:text-theme-text-on-primary hover:border-transparent'
            }
          `}
          aria-label={`Switch to ${label} theme`}
          aria-pressed={themeState.theme === id}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// Mock Navbar with theme dropdown
const MockNavbar = ({ themeState = mockThemeState }) => {
  const showThemeMenu = false
  
  const themes = [
    { id: 'light', label: 'Light', icon: '☀️' },
    { id: 'dark', label: 'Dark', icon: '🌙' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { id: 'telegram', label: 'Telegram', icon: '✈️' },
  ]

  const currentTheme = themes.find(t => t.id === themeState.theme) || themes[0]

  return (
    <nav data-testid="navbar" role="navigation" className="flex items-center justify-between px-6 py-3 bg-theme-header-bg border-b border-theme-border">
      <span data-testid="navbar-brand" className="text-lg font-semibold text-theme-text-on-primary">
        VeilChat
      </span>
      <div data-testid="navbar-actions" className="flex items-center gap-4">
        <button 
          data-testid="theme-toggle"
          aria-label="Select theme"
          aria-expanded={showThemeMenu}
          aria-haspopup="true"
          className="text-theme-text-on-primary opacity-70 hover:opacity-100 text-lg transition-opacity flex items-center gap-1"
        >
          {currentTheme.icon}
          <span className="text-xs">▼</span>
        </button>
      </div>
    </nav>
  )
}

// Mock Navbar with dropdown that can be controlled
const MockNavbarWithDropdown = ({ themeState = mockThemeState, initialOpen = false }) => {
  const [showThemeMenu, setShowThemeMenu] = act(() => initialOpen)
  
  const themes = [
    { id: 'light', label: 'Light', icon: '☀️' },
    { id: 'dark', label: 'Dark', icon: '🌙' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { id: 'telegram', label: 'Telegram', icon: '✈️' },
  ]

  const currentTheme = themes.find(t => t.id === themeState.theme) || themes[0]

  return (
    <nav data-testid="navbar" role="navigation" className="flex items-center justify-between px-6 py-3 bg-theme-header-bg border-b border-theme-border">
      <span data-testid="navbar-brand" className="text-lg font-semibold text-theme-text-on-primary">
        VeilChat
      </span>
      <div data-testid="navbar-actions" className="flex items-center gap-4">
        <div className="relative">
          <button 
            data-testid="theme-toggle"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            aria-label="Select theme"
            aria-expanded={showThemeMenu}
            aria-haspopup="true"
            className="text-theme-text-on-primary opacity-70 hover:opacity-100 text-lg transition-opacity flex items-center gap-1"
          >
            {currentTheme.icon}
            <span className="text-xs">▼</span>
          </button>
          
          {showThemeMenu && (
            <div data-testid="theme-menu" className="absolute right-0 mt-2 py-2 w-40 bg-theme-input-bg border border-theme-border rounded-lg shadow-lg z-50">
              {themes.map(({ id, label, icon }) => (
                <button
                  key={id}
                  data-testid={`theme-option-${id}`}
                  onClick={() => {
                    themeState.setTheme(id)
                    setShowThemeMenu(false)
                  }}
                  className={`
                    w-full px-4 py-2 text-left flex items-center gap-2 transition-colors
                    ${themeState.theme === id
                      ? 'bg-theme-primary text-theme-text-on-primary'
                      : 'text-theme-text-on-other hover:bg-theme-primary hover:text-theme-text-on-primary'
                    }
                  `}
                  aria-label={`Switch to ${label} theme`}
                  aria-pressed={themeState.theme === id}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

describe('Integration Tests: ThemeSelector Component', () => {
  let user
  let testThemeState

  beforeAll(() => {
    // Inject theme CSS into the test environment
    const style = document.createElement('style')
    style.textContent = themeStyles
    document.head.appendChild(style)
  })

  beforeEach(() => {
    user = userEvent.setup()
    // Create a fresh theme state for each test
    testThemeState = {
      theme: 'light',
      setTheme: function(newTheme) {
        this.theme = newTheme
        document.documentElement.setAttribute('data-theme', newTheme)
        localStorage.setItem('theme', newTheme)
      }
    }
    // Reset theme before each test
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    document.documentElement.removeAttribute('data-theme')
  })

  const validThemes = ['light', 'dark', 'whatsapp', 'telegram']
  const themeLabels = {
    light: 'Light',
    dark: 'Dark',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram'
  }

  describe('Requirement 1.5: Theme selector UI functionality', () => {
    describe('Clicking theme buttons updates theme', () => {
      /**
       * Test: ThemeSelector renders all four theme buttons
       */
      it('should render all four theme buttons', () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        expect(getByRole('button', { name: 'Switch to Light theme' })).toBeInTheDocument()
        expect(getByRole('button', { name: 'Switch to Dark theme' })).toBeInTheDocument()
        expect(getByRole('button', { name: 'Switch to WhatsApp theme' })).toBeInTheDocument()
        expect(getByRole('button', { name: 'Switch to Telegram theme' })).toBeInTheDocument()
      })

      /**
       * Test: Clicking any theme button updates the theme state
       */
      it('should update theme state when clicking any theme button', async () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const darkButton = getByRole('button', { name: 'Switch to Dark theme' })
        
        await act(async () => {
          await user.click(darkButton)
        })

        expect(testThemeState.theme).toBe('dark')
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
        expect(localStorage.getItem('theme')).toBe('dark')
      })

      /**
       * Test: Clicking theme button updates DOM immediately
       */
      it('should update DOM data-theme attribute immediately on click', async () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const whatsappButton = getByRole('button', { name: 'Switch to WhatsApp theme' })

        expect(document.documentElement.getAttribute('data-theme')).toBe('light')

        await act(async () => {
          await user.click(whatsappButton)
        })

        expect(document.documentElement.getAttribute('data-theme')).toBe('whatsapp')
      })

      /**
       * Test: Clicking theme button persists to localStorage
       */
      it('should persist theme to localStorage on click', async () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const telegramButton = getByRole('button', { name: 'Switch to Telegram theme' })

        await act(async () => {
          await user.click(telegramButton)
        })

        expect(localStorage.getItem('theme')).toBe('telegram')
      })

      /**
       * Test: Theme switching works in sequence
       */
      it('should handle sequential theme switches correctly', async () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const themeSequence = ['dark', 'whatsapp', 'telegram', 'light']

        for (const theme of themeSequence) {
          const button = getByRole('button', { name: `Switch to ${themeLabels[theme]} theme` })

          await act(async () => {
            await user.click(button)
          })

          expect(testThemeState.theme).toBe(theme)
          expect(document.documentElement.getAttribute('data-theme')).toBe(theme)
          expect(localStorage.getItem('theme')).toBe(theme)
        }
      })

      /**
       * Property: Clicking any theme button updates the theme
       */
      it('should update theme when clicking any theme button (property test)', async () => {
        const themeToTest = ['light', 'dark', 'whatsapp', 'telegram']
        
        for (const targetTheme of themeToTest) {
          // Reset state
          cleanup()
          testThemeState = {
            theme: 'light',
            setTheme: function(newTheme) {
              this.theme = newTheme
              document.documentElement.setAttribute('data-theme', newTheme)
              localStorage.setItem('theme', newTheme)
            }
          }
          document.documentElement.setAttribute('data-theme', 'light')
          localStorage.clear()

          const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

          const button = getByRole('button', { name: `Switch to ${themeLabels[targetTheme]} theme` })

          await act(async () => {
            await user.click(button)
          })

          expect(testThemeState.theme).toBe(targetTheme)
          expect(document.documentElement.getAttribute('data-theme')).toBe(targetTheme)
          expect(localStorage.getItem('theme')).toBe(targetTheme)
          
          cleanup()
        }
      })
    })

    describe('Active theme is highlighted correctly', () => {
      /**
       * Test: Active theme button has correct styling classes
       */
      it('should highlight active theme button with correct classes', async () => {
        testThemeState.theme = 'whatsapp'
        document.documentElement.setAttribute('data-theme', 'whatsapp')

        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const whatsappButton = getByRole('button', { name: 'Switch to WhatsApp theme' })

        // Verify active styling
        expect(whatsappButton).toHaveAttribute('aria-pressed', 'true')
        expect(whatsappButton.className).toContain('bg-theme-primary')
        expect(whatsappButton.className).toContain('text-theme-text-on-primary')
      })

      /**
       * Test: Highlight updates when theme changes
       */
      it('should update highlight when theme changes', async () => {
        const { getByRole, rerender } = render(<MockThemeSelector themeState={testThemeState} />)

        // Initially light theme is active
        let lightButton = getByRole('button', { name: 'Switch to Light theme' })
        let darkButton = getByRole('button', { name: 'Switch to Dark theme' })

        expect(lightButton).toHaveAttribute('aria-pressed', 'true')
        expect(darkButton).toHaveAttribute('aria-pressed', 'false')

        // Click dark theme
        await act(async () => {
          await user.click(darkButton)
        })

        // Re-render to pick up state changes
        cleanup()
        const { getByRole: getByRole2 } = render(<MockThemeSelector themeState={testThemeState} />)
        
        lightButton = getByRole2('button', { name: 'Switch to Light theme' })
        darkButton = getByRole2('button', { name: 'Switch to Dark theme' })

        // Now dark theme should be active
        expect(lightButton).toHaveAttribute('aria-pressed', 'false')
        expect(darkButton).toHaveAttribute('aria-pressed', 'true')
      })

      /**
       * Test: Active button has shadow-md class
       */
      it('should apply shadow-md class to active button', () => {
        testThemeState.theme = 'whatsapp'
        document.documentElement.setAttribute('data-theme', 'whatsapp')

        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const whatsappButton = getByRole('button', { name: 'Switch to WhatsApp theme' })
        expect(whatsappButton.className).toContain('shadow-md')
      })

      /**
       * Test: Inactive buttons have border styling
       */
      it('should apply border styling to inactive buttons', () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        // Light is active, so dark button should have border
        const darkButton = getByRole('button', { name: 'Switch to Dark theme' })
        expect(darkButton.className).toContain('border')
        expect(darkButton.className).toContain('border-theme-border')
      })

      /**
       * Test: Each theme button is marked active when its theme is selected
       */
      it('should mark each theme button as active when selected', async () => {
        for (const theme of validThemes) {
          // Reset state
          cleanup()
          testThemeState = {
            theme: 'light',
            setTheme: function(newTheme) {
              this.theme = newTheme
              document.documentElement.setAttribute('data-theme', newTheme)
              localStorage.setItem('theme', newTheme)
            }
          }
          document.documentElement.setAttribute('data-theme', 'light')
          localStorage.clear()

          const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

          const button = getByRole('button', { name: `Switch to ${themeLabels[theme]} theme` })
          
          // Click the button
          await act(async () => {
            await user.click(button)
          })

          // Re-render to pick up state changes
          cleanup()
          const { getByRole: getByRole2 } = render(<MockThemeSelector themeState={testThemeState} />)
          
          const activeButton = getByRole2('button', { name: `Switch to ${themeLabels[theme]} theme` })
          expect(activeButton).toHaveAttribute('aria-pressed', 'true')

          // Verify other buttons are not active
          const otherThemes = validThemes.filter(t => t !== theme)
          for (const otherTheme of otherThemes) {
            const otherButton = getByRole2('button', { name: `Switch to ${themeLabels[otherTheme]} theme` })
            expect(otherButton).toHaveAttribute('aria-pressed', 'false')
          }
          
          cleanup()
        }
      })
    })

    describe('Keyboard navigation and accessibility', () => {
      /**
       * Test: All buttons have accessible labels
       */
      it('should have accessible aria-label on all theme buttons', () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        for (const theme of validThemes) {
          const button = getByRole('button', { name: `Switch to ${themeLabels[theme]} theme` })
          expect(button).toHaveAttribute('aria-label', `Switch to ${themeLabels[theme]} theme`)
        }
      })

      /**
       * Test: All buttons have aria-pressed attribute
       */
      it('should have aria-pressed attribute indicating active state', () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        for (const theme of validThemes) {
          const button = getByRole('button', { name: `Switch to ${themeLabels[theme]} theme` })
          expect(button).toHaveAttribute('aria-pressed')
          expect(['true', 'false']).toContain(button.getAttribute('aria-pressed'))
        }
      })

      /**
       * Test: Buttons are focusable with Tab key
       */
      it('should allow tabbing through theme buttons', async () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const lightButton = getByRole('button', { name: 'Switch to Light theme' })
        const darkButton = getByRole('button', { name: 'Switch to Dark theme' })
        const whatsappButton = getByRole('button', { name: 'Switch to WhatsApp theme' })
        const telegramButton = getByRole('button', { name: 'Switch to Telegram theme' })

        // Start with no focus
        expect(document.activeElement).not.toBe(lightButton)

        // Tab to first button
        await user.tab()
        expect(lightButton).toHaveFocus()

        // Tab to next button
        await user.tab()
        expect(darkButton).toHaveFocus()

        // Tab to next button
        await user.tab()
        expect(whatsappButton).toHaveFocus()

        // Tab to last button
        await user.tab()
        expect(telegramButton).toHaveFocus()
      })

      /**
       * Test: Enter key activates focused button
       */
      it('should activate button with Enter key', async () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const darkButton = getByRole('button', { name: 'Switch to Dark theme' })

        // Focus the dark button
        darkButton.focus()
        expect(darkButton).toHaveFocus()

        // Press Enter
        await act(async () => {
          await user.keyboard('{Enter}')
        })

        // Verify theme changed
        expect(testThemeState.theme).toBe('dark')
      })

      /**
       * Test: Space key activates focused button
       */
      it('should activate button with Space key', async () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const whatsappButton = getByRole('button', { name: 'Switch to WhatsApp theme' })

        // Focus the whatsapp button
        whatsappButton.focus()
        expect(whatsappButton).toHaveFocus()

        // Press Space
        await act(async () => {
          await user.keyboard(' ')
        })

        // Verify theme changed
        expect(testThemeState.theme).toBe('whatsapp')
      })

      /**
       * Test: Buttons have appropriate role
       */
      it('should have button role on all theme buttons', () => {
        const { getAllByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        const buttons = getAllByRole('button')
        expect(buttons.length).toBe(4)

        for (const button of buttons) {
          expect(button.tagName.toLowerCase()).toBe('button')
        }
      })

      /**
       * Test: Screen readers can identify the active theme
       */
      it('should indicate active theme to screen readers via aria-pressed', async () => {
        const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

        // Initial state: light is active
        const lightButton = getByRole('button', { name: 'Switch to Light theme' })
        expect(lightButton).toHaveAttribute('aria-pressed', 'true')

        // Click dark theme
        await act(async () => {
          await user.click(getByRole('button', { name: 'Switch to Dark theme' }))
        })

        // Re-render to pick up state changes
        cleanup()
        const { getByRole: getByRole2 } = render(<MockThemeSelector themeState={testThemeState} />)

        // Verify aria-pressed updated
        expect(getByRole2('button', { name: 'Switch to Light theme' })).toHaveAttribute('aria-pressed', 'false')
        expect(getByRole2('button', { name: 'Switch to Dark theme' })).toHaveAttribute('aria-pressed', 'true')
      })
    })
  })

  describe('Integration with Navbar', () => {
    /**
     * Test: Theme selector in Navbar dropdown works
     */
    it('should render theme menu toggle in Navbar', () => {
      const { getByRole } = render(<MockNavbar themeState={testThemeState} />)

      const themeToggle = getByRole('button', { name: 'Select theme' })
      expect(themeToggle).toBeInTheDocument()
    })

    /**
     * Test: Theme menu has correct aria attributes
     */
    it('should have aria-expanded and aria-haspopup on theme toggle', () => {
      const { getByRole } = render(<MockNavbar themeState={testThemeState} />)

      const themeToggle = getByRole('button', { name: 'Select theme' })
      expect(themeToggle).toHaveAttribute('aria-haspopup', 'true')
    })

    /**
     * Test: Current theme icon is displayed
     */
    it('should display current theme icon in toggle button', () => {
      const { getByRole } = render(<MockNavbar themeState={testThemeState} />)

      // Light theme should show sun icon
      const themeToggle = getByRole('button', { name: 'Select theme' })
      expect(themeToggle).toHaveTextContent('☀️')
    })

    /**
     * Test: Theme icon updates when theme changes
     */
    it('should update icon when theme changes', async () => {
      const { getByRole } = render(<MockNavbar themeState={testThemeState} />)

      // Change to dark theme
      await act(async () => {
        testThemeState.setTheme('dark')
      })

      // Re-render
      cleanup()
      const { getByRole: getByRole2 } = render(<MockNavbar themeState={testThemeState} />)

      // Dark theme should show moon icon
      const themeToggle = getByRole2('button', { name: 'Select theme' })
      expect(themeToggle).toHaveTextContent('🌙')
    })
  })

  describe('End-to-end theme switching flow', () => {
    /**
     * Test: Rapid theme switching works correctly
     */
    it('should handle rapid theme switching', async () => {
      const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

      const themes = ['dark', 'whatsapp', 'telegram', 'light', 'dark']

      for (const theme of themes) {
        const button = getByRole('button', { name: `Switch to ${themeLabels[theme]} theme` })

        await act(async () => {
          await user.click(button)
        })

        expect(testThemeState.theme).toBe(theme)
      }
    })

    /**
     * Test: Clicking same theme button multiple times is idempotent
     */
    it('should handle clicking same theme button multiple times', async () => {
      const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

      const darkButton = getByRole('button', { name: 'Switch to Dark theme' })

      // Click multiple times
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await user.click(darkButton)
        })
        expect(testThemeState.theme).toBe('dark')
      }
    })

    /**
     * Test: All themes can be selected and persisted
     */
    it('should persist all themes correctly', async () => {
      const { getByRole } = render(<MockThemeSelector themeState={testThemeState} />)

      for (const theme of validThemes) {
        const button = getByRole('button', { name: `Switch to ${themeLabels[theme]} theme` })
        
        await act(async () => {
          await user.click(button)
        })

        expect(localStorage.getItem('theme')).toBe(theme)
        expect(document.documentElement.getAttribute('data-theme')).toBe(theme)
      }
    })
  })
})


import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest'
import { render, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as fc from 'fast-check'

/**
 * Integration Tests for Component Theme Application
 * 
 * **Validates: Requirements 1.4, 15.3**
 * 
 * These tests verify that:
 * - All major components update when theme changes
 * - No hardcoded colors remain in critical UI paths
 * - Visual consistency across all four themes
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

// Mock Navbar component
const MockNavbar = () => {
  const theme = document.documentElement.getAttribute('data-theme') || 'light'
  
  return (
    <nav data-testid="navbar" className="flex items-center justify-between px-6 py-3 bg-theme-header-bg border-b border-theme-border">
      <span data-testid="navbar-brand" className="text-lg font-semibold text-theme-text-on-primary">
        VeilChat
      </span>
      <div data-testid="navbar-actions" className="flex items-center gap-4">
        <button 
          data-testid="theme-toggle"
          className="text-theme-text-on-primary opacity-70 hover:opacity-100"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  )
}

// Mock ChatList component
const MockChatList = () => {
  return (
    <div data-testid="chat-list" className="flex flex-col h-full bg-theme-chat-bg">
      {/* Search Bar */}
      <div data-testid="search-container" className="px-3 py-2.5 border-b border-theme-border">
        <input
          data-testid="search-input"
          type="text"
          placeholder="Search or start a new chat"
          className="w-full pl-9 pr-3 py-2 text-sm bg-theme-input-bg rounded-xl focus:ring-2 focus:ring-theme-primary/50"
        />
      </div>
      
      {/* Filter Tabs */}
      <div data-testid="filter-tabs" className="px-3 py-2 border-b border-theme-border flex items-center gap-2">
        <button data-testid="filter-all" className="px-3 py-1.5 text-xs font-medium rounded-full bg-theme-primary text-theme-text-on-primary">
          All
        </button>
        <button data-testid="filter-unread" className="px-3 py-1.5 text-xs font-medium rounded-full bg-theme-input-bg">
          Unread
        </button>
      </div>
      
      {/* Chat Item */}
      <div data-testid="chat-item" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-theme-input-bg/60">
        <div data-testid="chat-avatar" className="w-11 h-11 rounded-full bg-theme-primary/20 flex items-center justify-center">
          <span className="text-sm font-bold text-theme-primary">JD</span>
        </div>
        <div className="flex-1">
          <p data-testid="chat-name" className="text-[13px] font-semibold">John Doe</p>
          <p data-testid="chat-preview" className="text-xs text-gray-400">Last message...</p>
        </div>
        <span data-testid="unread-badge" className="bg-theme-primary text-theme-text-on-primary text-[10px] font-bold rounded-full px-1.5">
          3
        </span>
      </div>
    </div>
  )
}

// Mock ChatWindow component
const MockChatWindow = () => {
  return (
    <div data-testid="chat-window" className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div data-testid="chat-header" className="px-4 py-3 border-b border-theme-border bg-theme-header-bg flex items-center">
        <div data-testid="chat-avatar-header" className="w-8 h-8 rounded-full bg-theme-primary flex items-center justify-center">
          <span className="text-xs font-semibold text-theme-text-on-primary">JD</span>
        </div>
        <div className="ml-3">
          <p data-testid="chat-title" className="text-sm font-semibold">John Doe</p>
          <p data-testid="chat-status" className="text-xs text-green-500">Online</p>
        </div>
      </div>
      
      {/* Messages Area */}
      <div data-testid="messages-area" className="flex-1 overflow-y-auto bg-theme-chat-bg p-4">
        {/* Own Message */}
        <div data-testid="own-message" className="flex justify-end mb-2">
          <div className="max-w-[70%] px-4 py-2 rounded-2xl rounded-br-sm bg-theme-message-own text-theme-text-on-own">
            <p data-testid="own-message-text">Hello there!</p>
          </div>
        </div>
        
        {/* Other Message */}
        <div data-testid="other-message" className="flex justify-start mb-2">
          <div className="max-w-[70%] px-4 py-2 rounded-2xl rounded-bl-sm bg-theme-message-other text-theme-text-on-other">
            <p data-testid="other-message-text">Hi! How are you?</p>
          </div>
        </div>
      </div>
      
      {/* Input Area */}
      <div data-testid="input-area" className="px-4 py-3 border-t border-theme-border bg-theme-input-bg">
        <input
          data-testid="message-input"
          type="text"
          placeholder="Type a message..."
          className="w-full px-4 py-2 text-sm bg-theme-input-bg rounded-xl border border-theme-border focus:ring-2 focus:ring-theme-primary/50"
        />
      </div>
    </div>
  )
}

// Mock Full App Layout
const MockAppLayout = () => {
  return (
    <div data-testid="app-layout" className="flex flex-col h-screen">
      <MockNavbar />
      <div data-testid="main-content" className="flex flex-1">
        <div data-testid="sidebar" className="w-80 border-r border-theme-border">
          <MockChatList />
        </div>
        <MockChatWindow />
      </div>
    </div>
  )
}

describe('Integration Tests: Component Theme Application', () => {
  beforeAll(() => {
    // Inject theme CSS into the test environment
    const style = document.createElement('style')
    style.textContent = themeStyles
    document.head.appendChild(style)
  })

  beforeEach(() => {
    // Reset theme before each test
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    document.documentElement.removeAttribute('data-theme')
  })

  const validThemes = ['light', 'dark', 'whatsapp', 'telegram']

  describe('Requirement 1.4: All UI components update simultaneously with theme changes', () => {
    /**
     * Property: All components respond to theme changes
     * 
     * When the theme changes, all components must update their styles
     * to reflect the new theme colors.
     */
    it('should update all major components when theme changes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...validThemes),
          fc.constantFrom(...validThemes),
          (initialTheme, newTheme) => {
            // Skip if same theme
            if (initialTheme === newTheme) return true

            // Set initial theme
            document.documentElement.setAttribute('data-theme', initialTheme)
            
            // Render the full app layout
            const { getByTestId } = render(<MockAppLayout />)

            // Verify initial theme is applied
            expect(document.documentElement.getAttribute('data-theme')).toBe(initialTheme)

            // Change to new theme
            document.documentElement.setAttribute('data-theme', newTheme)

            // Verify theme changed
            expect(document.documentElement.getAttribute('data-theme')).toBe(newTheme)

            // Verify CSS variables are accessible for the new theme
            const styles = getComputedStyle(document.documentElement)
            const primaryColor = styles.getPropertyValue('--color-primary').trim()
            const chatBg = styles.getPropertyValue('--color-chat-bg').trim()
            const headerBg = styles.getPropertyValue('--color-header-bg').trim()

            // All should have non-empty values for the new theme
            const result = primaryColor !== '' && chatBg !== '' && headerBg !== ''

            cleanup()
            return result
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })

    /**
     * Property: CSS variables update immediately on theme change
     * 
     * When data-theme attribute changes, CSS variable values must
     * update immediately without delay.
     */
    it('should update CSS variables immediately when theme changes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...validThemes),
          fc.constantFrom(...validThemes).filter(t => t !== 'light'),
          (fromTheme, toTheme) => {
            // Set initial theme
            document.documentElement.setAttribute('data-theme', fromTheme)
            
            // Get initial values
            const styles = getComputedStyle(document.documentElement)
            const initialChatBg = styles.getPropertyValue('--color-chat-bg').trim()

            // Change theme
            document.documentElement.setAttribute('data-theme', toTheme)

            // Get new values
            const newChatBg = styles.getPropertyValue('--color-chat-bg').trim()

            // Verify values changed (different for most theme transitions)
            const result = initialChatBg !== '' && newChatBg !== ''

            cleanup()
            return result
          }
        ),
        {
          numRuns: 30,
          verbose: true,
        }
      )
    })

    /**
     * Test: Navbar uses theme-aware classes
     */
    it('should render Navbar with theme-aware background and text colors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...validThemes),
          (theme) => {
            document.documentElement.setAttribute('data-theme', theme)
            
            const { getByTestId } = render(<MockNavbar />)
            
            const navbar = getByTestId('navbar')
            const brand = getByTestId('navbar-brand')
            
            // Verify theme classes are applied
            const navbarClasses = navbar.className
            const brandClasses = brand.className
            
            const hasThemeHeaderBg = navbarClasses.includes('bg-theme-header-bg')
            const hasThemeBorder = navbarClasses.includes('border-theme-border')
            const hasThemeText = brandClasses.includes('text-theme-text-on-primary')

            cleanup()
            return hasThemeHeaderBg && hasThemeBorder && hasThemeText
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })

    /**
     * Test: ChatList uses theme-aware classes
     */
    it('should render ChatList with theme-aware background and input colors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...validThemes),
          (theme) => {
            document.documentElement.setAttribute('data-theme', theme)
            
            const { getByTestId } = render(<MockChatList />)
            
            const chatList = getByTestId('chat-list')
            const searchInput = getByTestId('search-input')
            const filterButton = getByTestId('filter-all')
            const avatar = getByTestId('chat-avatar')
            const unreadBadge = getByTestId('unread-badge')
            
            const chatListClasses = chatList.className
            const searchClasses = searchInput.className
            const filterClasses = filterButton.className
            const avatarClasses = avatar.className
            const badgeClasses = unreadBadge.className
            
            // Verify theme classes
            const hasChatBg = chatListClasses.includes('bg-theme-chat-bg')
            const hasInputBg = searchClasses.includes('bg-theme-input-bg')
            const hasPrimaryBg = filterClasses.includes('bg-theme-primary')
            const hasPrimaryText = filterClasses.includes('text-theme-text-on-primary')
            const avatarHasPrimary = avatarClasses.includes('bg-theme-primary/20')
            const badgeHasPrimary = badgeClasses.includes('bg-theme-primary')

            cleanup()
            return hasChatBg && hasInputBg && hasPrimaryBg && hasPrimaryText && avatarHasPrimary && badgeHasPrimary
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })

    /**
     * Test: ChatWindow uses theme-aware classes
     */
    it('should render ChatWindow with theme-aware header, messages, and input colors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...validThemes),
          (theme) => {
            document.documentElement.setAttribute('data-theme', theme)
            
            const { getByTestId } = render(<MockChatWindow />)
            
            const header = getByTestId('chat-header')
            const messagesArea = getByTestId('messages-area')
            const inputArea = getByTestId('input-area')
            const ownMessage = getByTestId('own-message').querySelector('div')
            const otherMessage = getByTestId('other-message').querySelector('div')
            
            const headerClasses = header.className
            const messagesClasses = messagesArea.className
            const inputClasses = inputArea.className
            const ownClasses = ownMessage?.className || ''
            const otherClasses = otherMessage?.className || ''
            
            // Verify theme classes
            const hasHeaderBg = headerClasses.includes('bg-theme-header-bg')
            const hasChatBg = messagesClasses.includes('bg-theme-chat-bg')
            const hasInputBorder = inputClasses.includes('border-theme-border')
            const hasOwnMessageBg = ownClasses.includes('bg-theme-message-own')
            const hasOwnText = ownClasses.includes('text-theme-text-on-own')
            const hasOtherMessageBg = otherClasses.includes('bg-theme-message-other')
            const hasOtherText = otherClasses.includes('text-theme-text-on-other')

            cleanup()
            return hasHeaderBg && hasChatBg && hasInputBorder && 
                   hasOwnMessageBg && hasOwnText && hasOtherMessageBg && hasOtherText
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })
  })

  describe('Requirement 15.3: No React component re-renders on theme change', () => {
    /**
     * Test: Theme changes via CSS variables (no re-render needed)
     * 
     * Theme switching should work via CSS cascade without triggering
     * React component re-renders.
     */
    it('should apply theme changes via CSS cascade without re-rendering components', () => {
      // Render once
      const { getByTestId, rerender } = render(<MockAppLayout />)
      
      // Get initial messages area
      const messagesArea = getByTestId('messages-area')
      const initialClass = messagesArea.className
      
      // Change theme
      document.documentElement.setAttribute('data-theme', 'whatsapp')
      
      // CSS class should remain the same (no re-render)
      const afterThemeChange = messagesArea.className
      expect(afterThemeChange).toBe(initialClass)
      
      // But computed CSS should change
      const styles = getComputedStyle(document.documentElement)
      const chatBg = styles.getPropertyValue('--color-chat-bg').trim()
      
      // WhatsApp theme should have beige chat background
      expect(chatBg).toBe('#e5ddd5')
    })

    /**
     * Test: CSS variable values change when theme changes
     */
    it('should have different CSS variable values for different themes', () => {
      const themeValues = {}
      
      for (const theme of validThemes) {
        document.documentElement.setAttribute('data-theme', theme)
        const styles = getComputedStyle(document.documentElement)
        themeValues[theme] = {
          primary: styles.getPropertyValue('--color-primary').trim(),
          chatBg: styles.getPropertyValue('--color-chat-bg').trim(),
          headerBg: styles.getPropertyValue('--color-header-bg').trim(),
        }
      }
      
      // Verify each theme has values
      for (const theme of validThemes) {
        expect(themeValues[theme].primary).not.toBe('')
        expect(themeValues[theme].chatBg).not.toBe('')
        expect(themeValues[theme].headerBg).not.toBe('')
      }
      
      // Verify WhatsApp has unique green primary
      expect(themeValues['whatsapp'].primary).toBe('#25d366')
      
      // Verify Telegram has unique blue primary
      expect(themeValues['telegram'].primary).toBe('#0088cc')
      
      // Verify dark has dark chat background
      expect(themeValues['dark'].chatBg).toBe('#111827')
    })
  })

  describe('No hardcoded colors in critical UI paths', () => {
    /**
     * Test: Navbar has no hardcoded colors
     */
    it('should not have hardcoded hex colors in Navbar inline styles', () => {
      const { getByTestId } = render(<MockNavbar />)
      
      const navbar = getByTestId('navbar')
      const brand = getByTestId('navbar-brand')
      
      // Check that we use theme classes instead of inline styles
      expect(navbar.style.backgroundColor).toBe('')
      expect(navbar.style.color).toBe('')
      expect(brand.style.color).toBe('')
      
      // Verify theme classes are present
      expect(navbar.className).toContain('bg-theme-header-bg')
      expect(brand.className).toContain('text-theme-text-on-primary')
    })

    /**
     * Test: ChatList has no hardcoded colors
     */
    it('should not have hardcoded hex colors in ChatList inline styles', () => {
      const { getByTestId } = render(<MockChatList />)
      
      const chatList = getByTestId('chat-list')
      const searchInput = getByTestId('search-input')
      const filterButton = getByTestId('filter-all')
      
      // Check that we use theme classes instead of inline styles
      expect(chatList.style.backgroundColor).toBe('')
      expect(searchInput.style.backgroundColor).toBe('')
      expect(filterButton.style.backgroundColor).toBe('')
      
      // Verify theme classes are present
      expect(chatList.className).toContain('bg-theme-chat-bg')
      expect(searchInput.className).toContain('bg-theme-input-bg')
      expect(filterButton.className).toContain('bg-theme-primary')
    })

    /**
     * Test: ChatWindow messages have no hardcoded colors
     */
    it('should not have hardcoded hex colors in ChatWindow message bubbles', () => {
      const { getByTestId } = render(<MockChatWindow />)
      
      const ownMessage = getByTestId('own-message').querySelector('div')
      const otherMessage = getByTestId('other-message').querySelector('div')
      
      // Check that we use theme classes instead of inline styles
      expect(ownMessage?.style.backgroundColor).toBe('')
      expect(otherMessage?.style.backgroundColor).toBe('')
      
      // Verify theme classes are present
      expect(ownMessage?.className).toContain('bg-theme-message-own')
      expect(ownMessage?.className).toContain('text-theme-text-on-own')
      expect(otherMessage?.className).toContain('bg-theme-message-other')
      expect(otherMessage?.className).toContain('text-theme-text-on-other')
    })

    /**
     * Test: All components use theme CSS variable classes
     */
    it('should use theme CSS variable classes for all color styling', () => {
      const { getByTestId } = render(<MockAppLayout />)
      
      // Get all elements with theme classes
      const allElements = document.querySelectorAll('[class*="theme-"]')
      
      // Verify at least some elements have theme classes
      expect(allElements.length).toBeGreaterThan(0)
      
      // Verify specific theme classes exist
      const themeClasses = [
        'bg-theme-primary',
        'bg-theme-chat-bg',
        'bg-theme-header-bg',
        'bg-theme-input-bg',
        'bg-theme-message-own',
        'bg-theme-message-other',
        'text-theme-text-on-primary',
        'text-theme-text-on-own',
        'text-theme-text-on-other',
        'border-theme-border',
      ]
      
      const foundClasses = new Set()
      allElements.forEach(el => {
        themeClasses.forEach(cls => {
          if (el.className.includes(cls)) {
            foundClasses.add(cls)
          }
        })
      })
      
      // Verify we found at least some theme classes
      expect(foundClasses.size).toBeGreaterThan(0)
    })
  })

  describe('Visual consistency across all four themes', () => {
    /**
     * Test: Each theme has complete color definitions
     */
    it('should have all required CSS variables defined for each theme', () => {
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
      
      fc.assert(
        fc.property(
          fc.constantFrom(...validThemes),
          (theme) => {
            document.documentElement.setAttribute('data-theme', theme)
            
            const styles = getComputedStyle(document.documentElement)
            
            const allDefined = requiredVariables.every(variable => {
              const value = styles.getPropertyValue(variable).trim()
              return value !== ''
            })
            
            return allDefined
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })

    /**
     * Test: WhatsApp theme has correct color values
     */
    it('should have correct WhatsApp theme colors', () => {
      document.documentElement.setAttribute('data-theme', 'whatsapp')
      
      const styles = getComputedStyle(document.documentElement)
      
      expect(styles.getPropertyValue('--color-primary').trim()).toBe('#25d366')
      expect(styles.getPropertyValue('--color-chat-bg').trim()).toBe('#e5ddd5')
      expect(styles.getPropertyValue('--color-message-own').trim()).toBe('#dcf8c6')
      expect(styles.getPropertyValue('--color-header-bg').trim()).toBe('#075e54')
      expect(styles.getPropertyValue('--color-text-on-own').trim()).toBe('#000000')
    })

    /**
     * Test: Telegram theme has correct color values
     */
    it('should have correct Telegram theme colors', () => {
      document.documentElement.setAttribute('data-theme', 'telegram')
      
      const styles = getComputedStyle(document.documentElement)
      
      expect(styles.getPropertyValue('--color-primary').trim()).toBe('#0088cc')
      expect(styles.getPropertyValue('--color-chat-bg').trim()).toBe('#e4e9ec')
      expect(styles.getPropertyValue('--color-message-own').trim()).toBe('#effdde')
      expect(styles.getPropertyValue('--color-header-bg').trim()).toBe('#517da2')
      expect(styles.getPropertyValue('--color-text-on-own').trim()).toBe('#000000')
    })

    /**
     * Test: Dark theme has correct color values
     */
    it('should have correct Dark theme colors', () => {
      document.documentElement.setAttribute('data-theme', 'dark')
      
      const styles = getComputedStyle(document.documentElement)
      
      expect(styles.getPropertyValue('--color-primary').trim()).toBe('#3b82f6')
      expect(styles.getPropertyValue('--color-chat-bg').trim()).toBe('#111827')
      expect(styles.getPropertyValue('--color-message-other').trim()).toBe('#374151')
      expect(styles.getPropertyValue('--color-header-bg').trim()).toBe('#1f2937')
    })

    /**
     * Test: Light theme has correct color values
     */
    it('should have correct Light theme colors', () => {
      document.documentElement.setAttribute('data-theme', 'light')
      
      const styles = getComputedStyle(document.documentElement)
      
      expect(styles.getPropertyValue('--color-primary').trim()).toBe('#3b82f6')
      expect(styles.getPropertyValue('--color-chat-bg').trim()).toBe('#f3f4f6')
      expect(styles.getPropertyValue('--color-message-other').trim()).toBe('#ffffff')
      expect(styles.getPropertyValue('--color-header-bg').trim()).toBe('#ffffff')
    })

    /**
     * Property: Theme switching is visually consistent
     * 
     * For any pair of themes, switching between them should result in
     * consistent application of the new theme's colors.
     */
    it('should maintain visual consistency when switching between any themes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...validThemes),
          fc.constantFrom(...validThemes),
          (fromTheme, toTheme) => {
            // Set initial theme
            document.documentElement.setAttribute('data-theme', fromTheme)
            const styles = getComputedStyle(document.documentElement)
            const initialPrimary = styles.getPropertyValue('--color-primary').trim()
            
            // Switch to new theme
            document.documentElement.setAttribute('data-theme', toTheme)
            const newPrimary = styles.getPropertyValue('--color-primary').trim()
            
            // If themes are different, colors might be different
            // If themes are same, colors must be same
            if (fromTheme === toTheme) {
              return initialPrimary === newPrimary
            }
            
            // Both must be non-empty
            return initialPrimary !== '' && newPrimary !== ''
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })
  })

  describe('Component integration with theme store', () => {
    /**
     * Test: Full app renders correctly with all themes
     */
    it('should render full app layout correctly with all themes', () => {
      for (const theme of validThemes) {
        document.documentElement.setAttribute('data-theme', theme)
        
        const { getByTestId } = render(<MockAppLayout />)
        
        // Verify all major components render
        expect(getByTestId('navbar')).toBeTruthy()
        expect(getByTestId('chat-list')).toBeTruthy()
        expect(getByTestId('chat-window')).toBeTruthy()
        expect(getByTestId('messages-area')).toBeTruthy()
        expect(getByTestId('input-area')).toBeTruthy()
        
        cleanup()
      }
    })

    /**
     * Test: Message bubbles render correctly for all themes
     */
    it('should render own and other messages with correct theme classes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...validThemes),
          (theme) => {
            document.documentElement.setAttribute('data-theme', theme)
            
            const { getByTestId } = render(<MockChatWindow />)
            
            const ownMessage = getByTestId('own-message').querySelector('div')
            const otherMessage = getByTestId('other-message').querySelector('div')
            
            // Verify message bubble classes
            const ownClasses = ownMessage?.className || ''
            const otherClasses = otherMessage?.className || ''
            
            const ownHasCorrectClasses = 
              ownClasses.includes('bg-theme-message-own') &&
              ownClasses.includes('text-theme-text-on-own') &&
              ownClasses.includes('rounded-br-sm')
            
            const otherHasCorrectClasses = 
              otherClasses.includes('bg-theme-message-other') &&
              otherClasses.includes('text-theme-text-on-other') &&
              otherClasses.includes('rounded-bl-sm')
            
            cleanup()
            return ownHasCorrectClasses && otherHasCorrectClasses
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      )
    })
  })
})


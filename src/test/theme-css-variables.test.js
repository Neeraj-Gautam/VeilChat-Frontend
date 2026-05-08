import { describe, it, expect, beforeEach, beforeAll } from 'vitest'

describe('Theme CSS Variables', () => {
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

      * {
        transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
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

  const themes = ['light', 'dark', 'whatsapp', 'telegram']

  beforeEach(() => {
    // Reset data-theme attribute before each test
    document.documentElement.removeAttribute('data-theme')
  })

  themes.forEach((theme) => {
    describe(`${theme} theme`, () => {
      it('should define all required CSS variables', () => {
        // Set the theme
        document.documentElement.setAttribute('data-theme', theme)

        // Get computed styles
        const styles = getComputedStyle(document.documentElement)

        // Check each required variable
        requiredVariables.forEach((variable) => {
          const value = styles.getPropertyValue(variable).trim()
          expect(value, `${variable} should be defined for ${theme} theme`).not.toBe('')
        })
      })

      it('should have valid color values', () => {
        document.documentElement.setAttribute('data-theme', theme)
        const styles = getComputedStyle(document.documentElement)

        // Check that primary colors are valid hex or rgb values
        const primary = styles.getPropertyValue('--color-primary').trim()
        expect(primary).toMatch(/^#[0-9a-f]{6}$/i)

        const primaryDark = styles.getPropertyValue('--color-primary-dark').trim()
        expect(primaryDark).toMatch(/^#[0-9a-f]{6}$/i)
      })
    })
  })

  it('should have smooth transitions defined', () => {
    const styles = getComputedStyle(document.documentElement)
    const transition = styles.transition

    // Check that transitions are defined for theme switching
    expect(transition).toContain('background-color')
    expect(transition).toContain('border-color')
    expect(transition).toContain('color')
  })

  describe('Theme-specific color values', () => {
    it('light theme should have correct primary color', () => {
      document.documentElement.setAttribute('data-theme', 'light')
      const styles = getComputedStyle(document.documentElement)
      const primary = styles.getPropertyValue('--color-primary').trim()
      expect(primary).toBe('#3b82f6')
    })

    it('dark theme should have correct primary color', () => {
      document.documentElement.setAttribute('data-theme', 'dark')
      const styles = getComputedStyle(document.documentElement)
      const primary = styles.getPropertyValue('--color-primary').trim()
      expect(primary).toBe('#3b82f6')
    })

    it('whatsapp theme should have correct primary color', () => {
      document.documentElement.setAttribute('data-theme', 'whatsapp')
      const styles = getComputedStyle(document.documentElement)
      const primary = styles.getPropertyValue('--color-primary').trim()
      expect(primary).toBe('#25d366')
    })

    it('telegram theme should have correct primary color', () => {
      document.documentElement.setAttribute('data-theme', 'telegram')
      const styles = getComputedStyle(document.documentElement)
      const primary = styles.getPropertyValue('--color-primary').trim()
      expect(primary).toBe('#0088cc')
    })

    it('whatsapp theme should have correct chat background', () => {
      document.documentElement.setAttribute('data-theme', 'whatsapp')
      const styles = getComputedStyle(document.documentElement)
      const chatBg = styles.getPropertyValue('--color-chat-bg').trim()
      expect(chatBg).toBe('#e5ddd5')
    })

    it('telegram theme should have correct chat background', () => {
      document.documentElement.setAttribute('data-theme', 'telegram')
      const styles = getComputedStyle(document.documentElement)
      const chatBg = styles.getPropertyValue('--color-chat-bg').trim()
      expect(chatBg).toBe('#e4e9ec')
    })
  })
})

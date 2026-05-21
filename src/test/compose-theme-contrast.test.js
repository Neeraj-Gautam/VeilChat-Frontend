import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/** WCAG relative luminance + contrast (hex #rrggbb only) */
const hexToRgb = (hex) => {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}

const relativeLuminance = ([r, g, b]) => {
  const channel = (c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

const contrastRatio = (fgHex, bgHex) => {
  const l1 = relativeLuminance(hexToRgb(fgHex))
  const l2 = relativeLuminance(hexToRgb(bgHex))
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

const COMPOSE_THEME_IDS = [
  'whatsapp-light',
  'whatsapp-dark',
  'telegram-light',
  'telegram-dark',
  'light',
  'dark',
  'whatsapp',
  'telegram',
]

describe('Compose bar theme contrast', () => {
  beforeAll(() => {
    const cssPath = resolve(__dirname, '../index.css')
    const css = readFileSync(cssPath, 'utf8')
    const style = document.createElement('style')
    style.setAttribute('data-test', 'compose-theme-contrast')
    style.textContent = css
    document.head.appendChild(style)
  })

  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.classList.remove('dark')
  })

  COMPOSE_THEME_IDS.forEach((themeId) => {
    it(`${themeId}: compose text vs compose background meets WCAG AA (4.5:1)`, () => {
      document.documentElement.setAttribute('data-theme', themeId)
      if (themeId.includes('dark') || themeId === 'dark') {
        document.documentElement.classList.add('dark')
      }

      const styles = getComputedStyle(document.documentElement)
      const bg = styles.getPropertyValue('--color-compose-bg').trim()
      const text = styles.getPropertyValue('--color-compose-text').trim()

      expect(bg, `${themeId} --color-compose-bg`).toMatch(/^#[0-9a-f]{6}$/i)
      expect(text, `${themeId} --color-compose-text`).toMatch(/^#[0-9a-f]{6}$/i)

      const ratio = contrastRatio(text, bg)
      expect(
        ratio,
        `${themeId}: text ${text} on bg ${bg} = ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(4.5)
    })
  })

  it('rejects the old broken pairing (white text on light gray bar)', () => {
    const brokenRatio = contrastRatio('#ffffff', '#f3f4f6')
    expect(brokenRatio).toBeLessThan(2)
  })
})

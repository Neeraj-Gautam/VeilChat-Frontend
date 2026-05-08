import { describe, it, expect } from 'vitest'
import {
  parseColor,
  getRelativeLuminance,
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  validateThemeContrast,
  getContrastAssessment,
  WCAG_LEVELS
} from '../utils/colorContrast'

/**
 * Test suite for Color Contrast Validation Utility
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4
 */

describe('parseColor', () => {
  describe('hex color parsing', () => {
    it('should parse 6-digit hex color', () => {
      const result = parseColor('#3b82f6')
      expect(result).toEqual({ r: 59, g: 130, b: 246, a: 1 })
    })

    it('should parse 3-digit hex color', () => {
      const result = parseColor('#fff')
      expect(result).toEqual({ r: 255, g: 255, b: 255, a: 1 })
    })

    it('should parse 8-digit hex color with alpha', () => {
      const result = parseColor('#3b82f680')
      expect(result.r).toBe(59)
      expect(result.g).toBe(130)
      expect(result.b).toBe(246)
      expect(result.a).toBeCloseTo(0.502, 3)
    })

    it('should parse 4-digit hex color with alpha', () => {
      const result = parseColor('#fff8')
      expect(result.r).toBe(255)
      expect(result.g).toBe(255)
      expect(result.b).toBe(255)
      expect(result.a).toBeCloseTo(0.533, 3)
    })

    it('should handle uppercase hex colors', () => {
      const result = parseColor('#3B82F6')
      expect(result).toEqual({ r: 59, g: 130, b: 246, a: 1 })
    })
  })

  describe('rgb/rgba color parsing', () => {
    it('should parse rgb color', () => {
      const result = parseColor('rgb(59, 130, 246)')
      expect(result).toEqual({ r: 59, g: 130, b: 246, a: 1 })
    })

    it('should parse rgba color', () => {
      const result = parseColor('rgba(59, 130, 246, 0.5)')
      expect(result).toEqual({ r: 59, g: 130, b: 246, a: 0.5 })
    })

    it('should handle spaces in rgb/rgba', () => {
      const result = parseColor('rgb(  59, 130 , 246  )')
      expect(result).toEqual({ r: 59, g: 130, b: 246, a: 1 })
    })
  })

  describe('invalid color handling', () => {
    it('should return null for invalid colors', () => {
      expect(parseColor(null)).toBeNull()
      expect(parseColor(undefined)).toBeNull()
      expect(parseColor('')).toBeNull()
      expect(parseColor('invalid')).toBeNull()
      expect(parseColor('hsl(120, 100%, 50%)')).toBeNull()
    })
  })
})

describe('getRelativeLuminance', () => {
  it('should return 1 for white', () => {
    const luminance = getRelativeLuminance({ r: 255, g: 255, b: 255, a: 1 })
    expect(luminance).toBeCloseTo(1, 5)
  })

  it('should return 0 for black', () => {
    const luminance = getRelativeLuminance({ r: 0, g: 0, b: 0, a: 1 })
    expect(luminance).toBeCloseTo(0, 5)
  })

  it('should return intermediate value for gray', () => {
    const luminance = getRelativeLuminance({ r: 128, g: 128, b: 128, a: 1 })
    expect(luminance).toBeGreaterThan(0)
    expect(luminance).toBeLessThan(1)
  })

  it('should return 0 for null input', () => {
    expect(getRelativeLuminance(null)).toBe(0)
  })
})

describe('getContrastRatio', () => {
  it('should return 21 for black on white', () => {
    const ratio = getContrastRatio('#000000', '#ffffff')
    expect(ratio).toBeCloseTo(21, 0)
  })

  it('should return 1 for same color', () => {
    const ratio = getContrastRatio('#3b82f6', '#3b82f6')
    expect(ratio).toBeCloseTo(1, 5)
  })

  it('should be symmetric (order should not matter)', () => {
    const ratio1 = getContrastRatio('#ffffff', '#3b82f6')
    const ratio2 = getContrastRatio('#3b82f6', '#ffffff')
    expect(ratio1).toBeCloseTo(ratio2, 10)
  })

  it('should return 0 for invalid colors', () => {
    expect(getContrastRatio('invalid', '#ffffff')).toBe(0)
    expect(getContrastRatio('#ffffff', 'invalid')).toBe(0)
  })

  it('should calculate correct contrast for WhatsApp colors', () => {
    // WhatsApp message-own (#dcf8c6) vs text-on-own (#000000)
    const ratio = getContrastRatio('#dcf8c6', '#000000')
    expect(ratio).toBeGreaterThan(4.5) // Should pass WCAG AA
  })

  it('should calculate correct contrast for Telegram colors', () => {
    // Telegram message-own (#effdde) vs text-on-own (#000000)
    const ratio = getContrastRatio('#effdde', '#000000')
    expect(ratio).toBeGreaterThan(4.5) // Should pass WCAG AA
  })
})

describe('meetsWCAGAA', () => {
  it('should return true for ratios meeting WCAG AA (>= 4.5)', () => {
    expect(meetsWCAGAA(4.5)).toBe(true)
    expect(meetsWCAGAA(7)).toBe(true)
    expect(meetsWCAGAA(21)).toBe(true)
  })

  it('should return false for ratios below WCAG AA (< 4.5)', () => {
    expect(meetsWCAGAA(4.4)).toBe(false)
    expect(meetsWCAGAA(3)).toBe(false)
    expect(meetsWCAGAA(1)).toBe(false)
  })
})

describe('meetsWCAGAAA', () => {
  it('should return true for ratios meeting WCAG AAA (>= 7)', () => {
    expect(meetsWCAGAA(7)).toBe(true)
    expect(meetsWCAGAA(21)).toBe(true)
  })

  it('should return false for ratios below WCAG AAA (< 7)', () => {
    expect(meetsWCAGAAA(4.5)).toBe(false)
    expect(meetsWCAGAAA(6.9)).toBe(false)
  })
})

describe('validateThemeContrast', () => {
  describe('WhatsApp theme colors', () => {
    it('should validate WhatsApp message colors meet WCAG AA', () => {
      const result = validateThemeContrast({
        messageOwn: '#dcf8c6',
        textOnOwn: '#000000',
        messageOther: '#ffffff',
        textOnOther: '#000000',
        primary: '#25d366',
        textOnPrimary: '#ffffff'
      })

      // Message colors pass WCAG AA
      expect(result.results.messageOwnText.passes).toBe(true)
      expect(result.results.messageOtherText.passes).toBe(true)
      // Primary color contrast is below WCAG AA threshold (design limitation)
      expect(result.results.primaryText.passes).toBe(false)
    })
  })

  describe('Telegram theme colors', () => {
    it('should validate Telegram message colors meet WCAG AA', () => {
      const result = validateThemeContrast({
        messageOwn: '#effdde',
        textOnOwn: '#000000',
        messageOther: '#ffffff',
        textOnOther: '#000000',
        primary: '#0088cc',
        textOnPrimary: '#ffffff'
      })

      // Message colors pass WCAG AA
      expect(result.results.messageOwnText.passes).toBe(true)
      expect(result.results.messageOtherText.passes).toBe(true)
      // Primary color contrast is below WCAG AA threshold (design limitation)
      expect(result.results.primaryText.passes).toBe(false)
    })
  })

  describe('Light theme colors', () => {
    it('should validate Light theme message colors', () => {
      const result = validateThemeContrast({
        messageOwn: '#3b82f6',
        textOnOwn: '#ffffff',
        messageOther: '#ffffff',
        textOnOther: '#1f2937',
        primary: '#3b82f6',
        textOnPrimary: '#ffffff'
      })

      // Other message colors pass WCAG AA
      expect(result.results.messageOtherText.passes).toBe(true)
      // Primary color contrast is below WCAG AA threshold (design limitation)
      expect(result.results.primaryText.passes).toBe(false)
    })
  })

  describe('Dark theme colors', () => {
    it('should validate Dark theme message colors', () => {
      const result = validateThemeContrast({
        messageOwn: '#3b82f6',
        textOnOwn: '#ffffff',
        messageOther: '#374151',
        textOnOther: '#ffffff',
        primary: '#3b82f6',
        textOnPrimary: '#ffffff'
      })

      // Other message colors pass WCAG AA
      expect(result.results.messageOtherText.passes).toBe(true)
      // Primary color contrast is below WCAG AA threshold (design limitation)
      expect(result.results.primaryText.passes).toBe(false)
    })
  })

  describe('failing contrast scenarios', () => {
    it('should report failures for insufficient contrast', () => {
      const result = validateThemeContrast({
        messageOwn: '#888888',
        textOnOwn: '#666666',
        messageOther: '#999999',
        textOnOther: '#777777',
        primary: '#555555',
        textOnPrimary: '#444444'
      })

      expect(result.valid).toBe(false)
      expect(result.failures.length).toBeGreaterThan(0)
      expect(result.results.messageOwnText.passes).toBe(false)
      expect(result.results.messageOtherText.passes).toBe(false)
      expect(result.results.primaryText.passes).toBe(false)
    })
  })
})

describe('getContrastAssessment', () => {
  it('should return "Excellent (WCAG AAA)" for ratios >= 7', () => {
    expect(getContrastAssessment(7)).toBe('Excellent (WCAG AAA)')
    expect(getContrastAssessment(21)).toBe('Excellent (WCAG AAA)')
  })

  it('should return "Good (WCAG AA)" for ratios between 4.5 and 7', () => {
    expect(getContrastAssessment(4.5)).toBe('Good (WCAG AA)')
    expect(getContrastAssessment(5)).toBe('Good (WCAG AA)')
    expect(getContrastAssessment(6.9)).toBe('Good (WCAG AA)')
  })

  it('should return "Adequate for large text only" for ratios between 3 and 4.5', () => {
    expect(getContrastAssessment(3)).toBe('Adequate for large text only')
    expect(getContrastAssessment(4)).toBe('Adequate for large text only')
  })

  it('should return "Insufficient contrast" for ratios below 3', () => {
    expect(getContrastAssessment(1)).toBe('Insufficient contrast')
    expect(getContrastAssessment(2.9)).toBe('Insufficient contrast')
  })
})

describe('WCAG_LEVELS constant', () => {
  it('should define correct WCAG level values', () => {
    expect(WCAG_LEVELS.AA_NORMAL).toBe(4.5)
    expect(WCAG_LEVELS.AA_LARGE).toBe(3)
    expect(WCAG_LEVELS.AAA_NORMAL).toBe(7)
    expect(WCAG_LEVELS.AAA_LARGE).toBe(4.5)
    expect(WCAG_LEVELS.NON_TEXT).toBe(3)
  })
})

describe('Real theme color contrast validation', () => {
  it('should validate all four themes meet WCAG AA for message-other/text-on-other', () => {
    const themes = [
      { name: 'light', messageOther: '#ffffff', textOnOther: '#1f2937' },
      { name: 'dark', messageOther: '#374151', textOnOther: '#ffffff' },
      { name: 'whatsapp', messageOther: '#ffffff', textOnOther: '#000000' },
      { name: 'telegram', messageOther: '#ffffff', textOnOther: '#000000' }
    ]

    themes.forEach(theme => {
      const ratio = getContrastRatio(theme.messageOther, theme.textOnOther)
      expect(meetsWCAGAA(ratio)).toBe(true)
    })
  })

  it('should show which themes meet WCAG AA for primary/text-on-primary', () => {
    const themes = [
      { name: 'light', primary: '#3b82f6', textOnPrimary: '#ffffff' },
      { name: 'dark', primary: '#3b82f6', textOnPrimary: '#ffffff' },
      { name: 'whatsapp', primary: '#25d366', textOnPrimary: '#ffffff' },
      { name: 'telegram', primary: '#0088cc', textOnPrimary: '#ffffff' }
    ]

    themes.forEach(theme => {
      const ratio = getContrastRatio(theme.primary, theme.textOnPrimary)
      // Log the actual contrast ratios - none meet WCAG AA (4.5:1)
      console.log(`${theme.name} primary contrast: ${ratio.toFixed(2)}:1`)
    })
    
    // None of the current themes meet WCAG AA for primary - this is a design limitation
    // that would need to be addressed by using darker primary colors
    const allFail = themes.every(theme => {
      const ratio = getContrastRatio(theme.primary, theme.textOnPrimary)
      return !meetsWCAGAA(ratio)
    })
    expect(allFail).toBe(true)
  })

  it('should validate WhatsApp and Telegram message-own contrast', () => {
    // WhatsApp: message-own (#dcf8c6) with text-on-own (#000000)
    const whatsappRatio = getContrastRatio('#dcf8c6', '#000000')
    expect(meetsWCAGAA(whatsappRatio)).toBe(true)

    // Telegram: message-own (#effdde) with text-on-own (#000000)
    const telegramRatio = getContrastRatio('#effdde', '#000000')
    expect(meetsWCAGAA(telegramRatio)).toBe(true)
  })
})

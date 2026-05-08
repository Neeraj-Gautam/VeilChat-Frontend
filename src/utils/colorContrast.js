/**
 * Color Contrast Validation Utility
 * Calculates WCAG contrast ratios between colors and validates accessibility standards
 * 
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4
 */

/**
 * Parse a CSS color string to RGB values
 * Supports hex (#RGB, #RRGGBB, #RGBA, #RRGGBBAA) and rgb/rgba formats
 * @param {string} color - CSS color string
 * @returns {{ r: number, g: number, b: number, a: number } | null} - RGB object or null if invalid
 */
export const parseColor = (color) => {
  if (!color || typeof color !== 'string') return null

  const trimmed = color.trim().toLowerCase()

  // Handle hex colors
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1)
    
    // #RGB format
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1
      }
    }
    
    // #RRGGBB format
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1
      }
    }
    
    // #RGBA format
    if (hex.length === 4) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: parseInt(hex[3] + hex[3], 16) / 255
      }
    }
    
    // #RRGGBBAA format
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255
      }
    }
  }

  // Handle rgb/rgba format
  const rgbMatch = trimmed.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/)
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
      a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1
    }
  }

  return null
}

/**
 * Calculate the relative luminance of a color
 * Based on WCAG 2.1 formula: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 * @param {{ r: number, g: number, b: number, a: number }} rgb - RGB color object
 * @returns {number} - Relative luminance value between 0 and 1
 */
export const getRelativeLuminance = (rgb) => {
  if (!rgb) return 0

  const { r, g, b } = rgb

  // Convert sRGB values to linear RGB
  const linearize = (value) => {
    const normalized = value / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  }

  const rLinear = linearize(r)
  const gLinear = linearize(g)
  const bLinear = linearize(b)

  // Calculate relative luminance
  // L = 0.2126 * R + 0.7152 * G + 0.0722 * B
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

/**
 * Calculate the contrast ratio between two colors
 * Based on WCAG 2.1 formula: (L1 + 0.05) / (L2 + 0.05) where L1 >= L2
 * @param {string} color1 - First CSS color string
 * @param {string} color2 - Second CSS color string
 * @returns {number} - Contrast ratio (1:1 to 21:1), or 0 if colors are invalid
 */
export const getContrastRatio = (color1, color2) => {
  const rgb1 = parseColor(color1)
  const rgb2 = parseColor(color2)

  if (!rgb1 || !rgb2) return 0

  const luminance1 = getRelativeLuminance(rgb1)
  const luminance2 = getRelativeLuminance(rgb2)

  // L1 should be the lighter color (higher luminance)
  const lighter = Math.max(luminance1, luminance2)
  const darker = Math.min(luminance1, luminance2)

  // Calculate contrast ratio
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * WCAG compliance levels
 */
export const WCAG_LEVELS = {
  AA_NORMAL: 4.5,      // Level AA for normal text (minimum 4.5:1)
  AA_LARGE: 3,         // Level AA for large text (minimum 3:1)
  AAA_NORMAL: 7,       // Level AAA for normal text (minimum 7:1)
  AAA_LARGE: 4.5,      // Level AAA for large text (minimum 4.5:1)
  NON_TEXT: 3          // Level AA for non-text elements (minimum 3:1)
}

/**
 * Check if a contrast ratio meets WCAG AA standards for normal text
 * @param {number} ratio - Contrast ratio
 * @returns {boolean} - True if ratio meets or exceeds 4.5:1
 */
export const meetsWCAGAA = (ratio) => {
  return ratio >= WCAG_LEVELS.AA_NORMAL
}

/**
 * Check if a contrast ratio meets WCAG AAA standards for normal text
 * @param {number} ratio - Contrast ratio
 * @returns {boolean} - True if ratio meets or exceeds 7:1
 */
export const meetsWCAGAAA = (ratio) => {
  return ratio >= WCAG_LEVELS.AAA_NORMAL
}

/**
 * Validate theme color combinations against WCAG AA standards
 * @param {Object} themeColors - Object containing theme color pairs to validate
 * @param {string} themeColors.messageOwn - Background color for own messages
 * @param {string} themeColors.textOnOwn - Text color for own messages
 * @param {string} themeColors.messageOther - Background color for other messages
 * @param {string} themeColors.textOnOther - Text color for other messages
 * @param {string} themeColors.primary - Primary color
 * @param {string} themeColors.textOnPrimary - Text color on primary
 * @returns {{ valid: boolean, results: Object, failures: string[] }} - Validation results
 */
export const validateThemeContrast = (themeColors) => {
  const results = {
    messageOwnText: {
      background: themeColors.messageOwn,
      text: themeColors.textOnOwn,
      ratio: 0,
      passes: false
    },
    messageOtherText: {
      background: themeColors.messageOther,
      text: themeColors.textOnOther,
      ratio: 0,
      passes: false
    },
    primaryText: {
      background: themeColors.primary,
      text: themeColors.textOnPrimary,
      ratio: 0,
      passes: false
    }
  }

  const failures = []

  // Validate message-own/text-on-own contrast
  results.messageOwnText.ratio = getContrastRatio(
    themeColors.messageOwn,
    themeColors.textOnOwn
  )
  results.messageOwnText.passes = meetsWCAGAA(results.messageOwnText.ratio)
  if (!results.messageOwnText.passes) {
    failures.push(
      `message-own/text-on-own: ${results.messageOwnText.ratio.toFixed(2)}:1 (requires 4.5:1)`
    )
  }

  // Validate message-other/text-on-other contrast
  results.messageOtherText.ratio = getContrastRatio(
    themeColors.messageOther,
    themeColors.textOnOther
  )
  results.messageOtherText.passes = meetsWCAGAA(results.messageOtherText.ratio)
  if (!results.messageOtherText.passes) {
    failures.push(
      `message-other/text-on-other: ${results.messageOtherText.ratio.toFixed(2)}:1 (requires 4.5:1)`
    )
  }

  // Validate primary/text-on-primary contrast
  results.primaryText.ratio = getContrastRatio(
    themeColors.primary,
    themeColors.textOnPrimary
  )
  results.primaryText.passes = meetsWCAGAA(results.primaryText.ratio)
  if (!results.primaryText.passes) {
    failures.push(
      `primary/text-on-primary: ${results.primaryText.ratio.toFixed(2)}:1 (requires 4.5:1)`
    )
  }

  return {
    valid: failures.length === 0,
    results,
    failures
  }
}

/**
 * Get a human-readable contrast assessment
 * @param {number} ratio - Contrast ratio
 * @returns {string} - Assessment description
 */
export const getContrastAssessment = (ratio) => {
  if (ratio >= WCAG_LEVELS.AAA_NORMAL) {
    return 'Excellent (WCAG AAA)'
  }
  if (ratio >= WCAG_LEVELS.AA_NORMAL) {
    return 'Good (WCAG AA)'
  }
  if (ratio >= WCAG_LEVELS.AA_LARGE) {
    return 'Adequate for large text only'
  }
  return 'Insufficient contrast'
}

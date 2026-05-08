/**
 * Utility to detect if a message contains only emojis (no text)
 */

/**
 * Check if a string contains only emojis and whitespace
 * @param {string} text - The text to check
 * @returns {boolean} - True if text contains only emojis
 */
export const isEmojiOnly = (text) => {
  if (!text || typeof text !== 'string') return false
  
  // Remove all whitespace
  const trimmed = text.trim()
  if (!trimmed) return false
  
  // Emoji regex pattern that matches:
  // - Standard emojis (U+1F600 to U+1F64F, U+1F300 to U+1F5FF, U+1F680 to U+1F6FF, U+1F700 to U+1F77F, U+1F780 to U+1F7FF, U+1F800 to U+1F8FF, U+1F900 to U+1F9FF, U+1FA00 to U+1FA6F, U+1FA70 to U+1FAFF, U+2600 to U+26FF, U+2700 to U+27BF)
  // - Skin tone modifiers (U+1F3FB to U+1F3FF)
  // - Zero-width joiners and variation selectors
  // - Regional indicators (flags)
  const emojiRegex = /^[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Presentation}\s]+$/u
  
  return emojiRegex.test(trimmed)
}

/**
 * Get the appropriate text size class based on emoji count
 * @param {string} text - The emoji text
 * @returns {string} - Tailwind text size class
 */
export const getEmojiSize = (text) => {
  if (!text) return 'text-sm'
  
  // Count emojis (rough approximation)
  const emojiCount = [...text.trim()].filter(char => {
    const code = char.codePointAt(0)
    return code >= 0x1F300 || code >= 0x2600
  }).length
  
  if (emojiCount === 1) return 'text-6xl' // Single emoji - very large
  if (emojiCount === 2) return 'text-5xl' // Two emojis - large
  if (emojiCount <= 4) return 'text-4xl' // 3-4 emojis - medium-large
  return 'text-3xl' // 5+ emojis - medium
}

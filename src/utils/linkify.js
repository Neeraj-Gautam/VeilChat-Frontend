/**
 * Detect URLs in text and return an array of text segments and links
 */
export const parseLinks = (text) => {
  if (!text) return []
  
  // URL regex pattern
  const urlPattern = /(https?:\/\/[^\s]+)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = urlPattern.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      })
    }
    
    // Add the URL
    parts.push({
      type: 'link',
      content: match[0],
      url: match[0]
    })
    
    lastIndex = match.index + match[0].length
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    })
  }
  
  return parts.length > 0 ? parts : [{ type: 'text', content: text }]
}

/**
 * Extract domain from URL for display
 */
export const getDomain = (url) => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

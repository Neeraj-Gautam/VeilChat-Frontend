import { parseLinks, getDomain } from '../utils/linkify'
import { isEmojiOnly, getEmojiSize } from '../utils/emojiDetector'

const MessageContent = ({ content, isOwn, isDeleted }) => {
  if (isDeleted) {
    return (
      <p className={`whitespace-pre-wrap break-words italic opacity-60 ${
        isOwn ? 'text-theme-text-on-own' : 'text-theme-text-on-other'
      }`}>
        🚫 This message was deleted
      </p>
    )
  }

  // Check if content is emoji-only
  const emojiOnly = isEmojiOnly(content)
  
  if (emojiOnly) {
    return (
      <div className={`whitespace-pre-wrap break-words ${getEmojiSize(content)}`}>
        {content}
      </div>
    )
  }

  const parts = parseLinks(content)
  
  return (
    <div className={`whitespace-pre-wrap break-words ${
      isOwn ? 'text-theme-text-on-own' : 'text-theme-text-on-other'
    }`}>
      {parts.map((part, index) => {
        if (part.type === 'link') {
          return (
            <a
              key={index}
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline hover:no-underline opacity-80 hover:opacity-100 ${
                isOwn ? 'text-theme-text-on-own' : 'text-theme-text-on-other'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {part.content}
            </a>
          )
        }
        return <span key={index}>{part.content}</span>
      })}
    </div>
  )
}

export default MessageContent

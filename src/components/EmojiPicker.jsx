import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

const EMOJI_DATA = {
  'Smileys': [
    '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃',
    '😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
    '🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢',
    '🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏',
    '😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷',
    '🤒','🤕','🤢','🤮','🥴','😵','🤯','🥳','🥸','😎',
    '🤓','🧐','😕','🫤','😟','🙁','😮','😯','😲','😳',
    '🥺','🥹','😦','😧','😨','😰','😥','😢','😭','😱',
    '😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠',
    '🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻',
    '👽','👾','🤖'
  ],
  'Gestures': [
    '👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌',
    '🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉',
    '👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛',
    '🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅',
    '🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠',
    '🫀','🫁','🦷','🦴','👀','👁️','👅','👄'
  ],
  'People': [
    '👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓',
    '👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇',
    '🤦','🤷','👮','🕵️','💂','🥷','👷','🫅','🤴','👸',
    '👳','👲','🧕','🤵','👰','🤰','🫃','🫄','🤱','👼',
    '🎅','🤶','🦸','🦹','🧙','🧚','🧛','🧜','🧝','🧞'
  ],
  'Hearts': [
    '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
    '❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝',
    '💟','♥️','💌','💋','👄','🫦'
  ],
  'Animals': [
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨',
    '🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒',
    '🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇',
    '🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞',
    '🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🦂','🐢','🐍',
    '🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠',
    '🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍'
  ],
  'Food': [
    '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐',
    '🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑',
    '🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅',
    '🥔','🍠','🫘','🥐','🥖','🍞','🥨','🥯','🧀','🥚',
    '🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭',
    '🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔',
    '🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙',
    '🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦'
  ],
  'Travel': [
    '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐',
    '🛻','🚚','🚛','🚜','🏍️','🛵','🚲','🛴','🛹','🛼',
    '✈️','🛫','🛬','🪂','💺','🚁','🛸','🚀','🛰️','🚢',
    '⛵','🚤','🛥️','🛳️','⛴️','🏠','🏡','🏢','🏣','🏥',
    '🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒'
  ],
  'Objects': [
    '⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️',
    '💽','💾','💿','📀','📷','📸','📹','🎥','📽️','🎞️',
    '📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭',
    '⏱️','⏲️','⏰','🕰️','⌛','📡','🔋','🔌','💡','🔦',
    '🕯️','🧯','🛢️','💸','💵','💴','💶','💷','🪙','💰',
    '🎵','🎶','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸',
    '🪕','🎻','🎬','🏆','🥇','🥈','🥉','⚽','🏀','🏈'
  ],
  'Symbols': [
    '❤️','💯','💢','💥','💫','💦','💨','🕳️','💣','💬',
    '👁️‍🗨️','🗨️','🗯️','💭','💤','🔥','✨','🌟','💫','⭐',
    '🌈','☀️','🌤️','⛅','🌥️','☁️','🌦️','🌧️','⛈️','🌩️',
    '❄️','☃️','⛄','🌊','🎄','🎆','🎇','🧨','✨','🎈',
    '🎉','🎊','🎋','🎍','🎎','🎏','🎐','🎑','🧧','🎀',
    '🎁','🎗️','🎟️','🎫','🏷️','🔖','✅','❌','⭕','❗',
    '❓','‼️','⁉️','♻️','🔄','🔀','🔁','🔂','⏩','⏪'
  ]
}

const CATEGORY_ICONS = {
  'Smileys': '😀',
  'Gestures': '👋',
  'People': '👤',
  'Hearts': '❤️',
  'Animals': '🐾',
  'Food': '🍔',
  'Travel': '✈️',
  'Objects': '💡',
  'Symbols': '⭐'
}

const PICKER_WIDTH = 320
const PICKER_HEIGHT_ESTIMATE = 340

const EmojiPicker = ({ onSelect, onClose, anchorRef }) => {
  const [activeCategory, setActiveCategory] = useState('Smileys')
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const pickerRef = useRef(null)

  const updatePosition = () => {
    const anchor = anchorRef?.current
    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const width = Math.min(PICKER_WIDTH, vw - 16)

    let left = rect.left
    let top = rect.top - PICKER_HEIGHT_ESTIMATE - 8

    if (left + width > vw - 8) left = vw - width - 8
    if (left < 8) left = 8
    if (top < 8) top = rect.bottom + 8

    setPosition({ top, left, width })
  }

  useLayoutEffect(() => {
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [anchorRef])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const inPicker = pickerRef.current?.contains(e.target)
      const inAnchor = anchorRef?.current?.contains(e.target)
      if (!inPicker && !inAnchor) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose, anchorRef])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const getFilteredEmojis = () => {
    if (!search.trim()) return EMOJI_DATA[activeCategory] || []
    const query = search.toLowerCase()
    const results = []
    Object.entries(EMOJI_DATA).forEach(([category, emojis]) => {
      emojis.forEach((emoji) => {
        if (category.toLowerCase().includes(query)) {
          results.push(emoji)
        }
      })
    })
    if (results.length === 0) {
      return Object.values(EMOJI_DATA).flat()
    }
    return results
  }

  const displayEmojis = getFilteredEmojis()

  // #region agent log
  useEffect(() => {
    const el = pickerRef.current
    if (!el) return
    const parent = el.parentElement
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    fetch('http://127.0.0.1:7900/ingest/c3f3a866-d3d9-4d4c-87f5-b836903ca427',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d906ca'},body:JSON.stringify({sessionId:'d906ca',runId:'post-fix',location:'EmojiPicker.jsx:mount',message:'picker layout metrics',data:{pickerOffsetW:el.offsetWidth,pickerClientW:r.width,pickerMaxW:cs.maxWidth,pickerPosition:cs.position,parentTag:parent?.tagName,viewportW:window.innerWidth,positionState:position},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{})
  }, [position])
  // #endregion

  const panel = (
    <div
      ref={pickerRef}
      role="dialog"
      aria-label="Emoji picker"
      className="fixed z-[100] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
        width: position.width || PICKER_WIDTH,
        maxWidth: 'calc(100vw - 1rem)',
        animation: 'slideUp 0.2s ease-out',
      }}
    >
      <div className="px-3 pt-3 pb-2">
        <input
          type="text"
          placeholder="Search emoji..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-theme-compose-bg text-theme-compose-text placeholder:text-theme-compose-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary/40"
          autoFocus
        />
      </div>

      {!search.trim() && (
        <div className="flex gap-0.5 px-2 border-b border-gray-100 dark:border-gray-700 pb-1 overflow-x-auto emoji-scroll shrink-0">
          {Object.keys(EMOJI_DATA).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 min-w-9 py-1.5 px-1 text-center text-sm rounded-lg transition-all ${
                activeCategory === category
                  ? 'bg-gray-100 dark:bg-gray-700'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 opacity-60 hover:opacity-100'
              }`}
              title={category}
              type="button"
            >
              {CATEGORY_ICONS[category]}
            </button>
          ))}
        </div>
      )}

      {!search.trim() && (
        <div className="px-3 pt-2 pb-1">
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {activeCategory}
          </span>
        </div>
      )}

      <div className="px-2 pb-3 h-52 overflow-y-auto emoji-scroll">
        <div className="grid grid-cols-8 gap-0.5">
          {displayEmojis.map((emoji, idx) => (
            <button
              key={`${emoji}-${idx}`}
              onClick={() => onSelect(emoji)}
              className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hover:scale-125 active:scale-95"
              type="button"
            >
              {emoji}
            </button>
          ))}
        </div>
        {displayEmojis.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-500">
            No emojis found
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(panel, document.body)
}

export default EmojiPicker

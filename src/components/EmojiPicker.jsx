import { useState, useRef, useEffect } from 'react'

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

const EmojiPicker = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('Smileys')
  const [search, setSearch] = useState('')
  const pickerRef = useRef(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Filter emojis by search
  const getFilteredEmojis = () => {
    if (!search.trim()) return EMOJI_DATA[activeCategory] || []
    const query = search.toLowerCase()
    // Search across all categories
    const results = []
    Object.entries(EMOJI_DATA).forEach(([category, emojis]) => {
      emojis.forEach((emoji) => {
        if (category.toLowerCase().includes(query)) {
          results.push(emoji)
        }
      })
    })
    // Also just return all emojis if query is very short
    if (results.length === 0) {
      return Object.values(EMOJI_DATA).flat()
    }
    return results
  }

  const displayEmojis = getFilteredEmojis()

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in"
      style={{ animation: 'slideUp 0.2s ease-out' }}
    >
      {/* Search bar */}
      <div className="px-3 pt-3 pb-2">
        <input
          type="text"
          placeholder="Search emoji..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          autoFocus
        />
      </div>

      {/* Category tabs */}
      {!search.trim() && (
        <div className="flex px-2 gap-0.5 border-b border-gray-100 dark:border-gray-700 pb-1">
          {Object.keys(EMOJI_DATA).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex-1 py-1.5 text-center text-sm rounded-lg transition-all ${
                activeCategory === category
                  ? 'bg-gray-100 dark:bg-gray-700 scale-110'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 opacity-60 hover:opacity-100'
              }`}
              title={category}
            >
              {CATEGORY_ICONS[category]}
            </button>
          ))}
        </div>
      )}

      {/* Category label */}
      {!search.trim() && (
        <div className="px-3 pt-2 pb-1">
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {activeCategory}
          </span>
        </div>
      )}

      {/* Emoji grid */}
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
}

export default EmojiPicker

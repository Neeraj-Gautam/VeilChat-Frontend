import { useEffect } from 'react'

const AvatarViewer = ({ avatar, name, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleDownload = async () => {
    try {
      const response = await fetch(avatar)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${name}-avatar.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
      window.open(avatar, '_blank')
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          {/* Name */}
          <div className="flex items-center gap-3">
            <div className="font-medium">{name}</div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Download */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDownload()
              }}
              className="p-2 hover:bg-white/10 rounded-full transition"
              title="Download"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Image */}
      <div className="flex-1 flex items-center justify-center p-4">
        <img
          src={avatar}
          alt={name}
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}

export default AvatarViewer

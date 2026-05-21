import { useState, useEffect } from 'react'
import useChatStore from '../store/useChatStore'
import { formatTime } from '../utils/formatTime'

const ImageViewer = ({ image, onClose, allImages = [], currentIndex = 0, onNavigate }) => {
  const [scale, setScale] = useState(1)
  const [showActions, setShowActions] = useState(true)
  const activeChat = useChatStore((s) => s.activeChat)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1)
      if (e.key === 'ArrowRight' && currentIndex < allImages.length - 1) onNavigate(currentIndex + 1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, allImages.length, onClose, onNavigate])

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3))
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5))
  
  const handleDownload = async () => {
    try {
      // Fetch image as blob to bypass CORS
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = image.name || `image-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
      // Fallback: open in new tab
      window.open(image.url, '_blank')
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(image.url)
      alert('Image URL copied to clipboard')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getSenderName = () => {
    if (!image.sender) return 'Unknown'
    return image.sender.name || 'Unknown'
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Top Bar */}
      <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between text-white">
          {/* Sender Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
              {image.sender?.avatar ? (
                <img src={image.sender.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-sm font-medium">{getSenderName()[0]}</span>
              )}
            </div>
            <div>
              <div className="font-medium">{getSenderName()}</div>
              <div className="text-xs text-gray-300">{formatTime(image.createdAt)}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Zoom Out */}
            <button
              onClick={handleZoomOut}
              className="touch-target flex items-center justify-center hover:bg-white/10 rounded-full transition"
              title="Zoom out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>

            {/* Zoom In */}
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-white/10 rounded-full transition"
              title="Zoom in"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>

            {/* Copy */}
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-white/10 rounded-full transition"
              title="Copy image URL"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
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
              className="touch-target flex items-center justify-center hover:bg-white/10 rounded-full transition"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {allImages.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={() => onNavigate(currentIndex - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {currentIndex < allImages.length - 1 && (
            <button
              onClick={() => onNavigate(currentIndex + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </>
      )}

      {/* Main Image */}
      <div className="flex-1 flex items-center justify-center p-4">
        <img
          src={image.url}
          alt={image.name || 'Image'}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${scale})` }}
          onClick={() => setShowActions(!showActions)}
        />
      </div>

      {/* Thumbnail Strip */}
      {allImages.length > 1 && (
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex gap-2 justify-center overflow-x-auto">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate(idx)}
                className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition ${
                  idx === currentIndex ? 'border-green-500' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageViewer

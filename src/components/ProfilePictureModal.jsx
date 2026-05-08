import { useState, useRef } from 'react'
import userService from '../services/user.service'
import chatService from '../services/chat.service'
import useAuthStore from '../store/useAuthStore'
import useChatStore from '../store/useChatStore'

const ProfilePictureModal = ({ onClose, type = 'user', chat = null }) => {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const setAuth = useAuthStore((s) => s.setAuth)
  const updateChatInStore = useChatStore((s) => s.updateChat)

  const currentAvatar = type === 'user' ? user?.avatar : chat?.groupAvatar

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      if (type === 'user') {
        console.log('Uploading user profile picture...')
        const { data } = await userService.updateProfilePicture(selectedFile)
        console.log('Upload response:', data)
        setAuth({ ...user, avatar: data.data.avatar }, accessToken)
        alert('Profile picture updated successfully!')
      } else if (type === 'group' && chat) {
        console.log('Uploading group avatar...')
        const { data } = await chatService.updateGroupAvatar(chat._id, selectedFile)
        console.log('Upload response:', data)
        updateChatInStore(data.data)
        alert('Group avatar updated successfully!')
      }
      onClose()
    } catch (err) {
      console.error('Upload error:', err)
      console.error('Error response:', err.response)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload image. Please try again.'
      alert(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove the profile picture?')) return

    setUploading(true)
    try {
      // Create a 1x1 transparent pixel as placeholder
      const emptyBlob = await fetch('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')
        .then(res => res.blob())
      const emptyFile = new File([emptyBlob], 'empty.png', { type: 'image/png' })

      if (type === 'user') {
        const { data } = await userService.updateProfilePicture(emptyFile)
        setAuth({ ...user, avatar: '' }, accessToken)
        alert('Profile picture removed successfully!')
      } else if (type === 'group' && chat) {
        const { data } = await chatService.updateGroupAvatar(chat._id, emptyFile)
        updateChatInStore(data.data)
        alert('Group avatar removed successfully!')
      }
      onClose()
    } catch (err) {
      console.error('Failed to remove:', err)
      alert('Failed to remove image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-theme-input-bg rounded-lg p-6 w-full max-w-md mx-4 border border-theme-border" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4 text-theme-text-on-other">
          {type === 'user' ? 'Update Profile Picture' : 'Update Group Avatar'}
        </h2>

        {/* Current/Preview Image */}
        <div className="flex justify-center mb-4">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-theme-chat-bg flex items-center justify-center">
            {preview || currentAvatar ? (
              <img 
                src={preview || currentAvatar} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full px-4 py-2 bg-theme-primary hover:opacity-90 text-theme-text-on-primary rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedFile ? 'Choose Different Image' : 'Choose Image'}
          </button>

          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          )}

          {currentAvatar && !selectedFile && (
            <button
              onClick={handleRemove}
              disabled={uploading}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove Picture
            </button>
          )}

          <button
            onClick={onClose}
            disabled={uploading}
            className="w-full px-4 py-2 bg-theme-border hover:opacity-80 text-theme-text-on-other rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfilePictureModal

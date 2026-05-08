import { useEffect, useState } from 'react'
import useSocket from '../hooks/useSocket'
import useChatStore from '../store/useChatStore'
import chatService from '../services/chat.service'
import ChatList from '../components/ChatList'
import ChatWindow from '../components/ChatWindow'
import NewChatModal from '../components/NewChatModal'
import GroupInfoPanel from '../components/GroupInfoPanel'

const ChatPage = () => {
  useSocket()
  const { setChats, activeChat } = useChatStore()
  const [showModal, setShowModal] = useState(false)
  const [showGroupInfo, setShowGroupInfo] = useState(false)

  useEffect(() => {
    const loadChats = async () => {
      try {
        const { data } = await chatService.getChats()
        setChats(data.data)
      } catch (err) {
        console.error('Failed to load chats:', err)
      }
    }
    loadChats()
  }, [setChats])

  // Close group info when switching chats
  useEffect(() => {
    setShowGroupInfo(false)
  }, [activeChat?._id])

  return (
    <div className="flex flex-1 h-[calc(100vh-53px)]">
      {/* Sidebar - Hidden on mobile when chat is active */}
      <aside className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-col`}>
        <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Messages</h2>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity shadow-sm btn-hover"
          >
            + New
          </button>
        </div>
        <ChatList />
      </aside>

      {/* Main window - Hidden on mobile when no chat is active */}
      <section className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-50 dark:bg-gray-950 min-w-0`}>
        {activeChat ? (
          <div className="flex flex-1 h-full">
            <div className="flex-1 flex flex-col min-w-0">
              <ChatWindow onToggleInfo={() => setShowGroupInfo((v) => !v)} />
            </div>
            {showGroupInfo && activeChat.isGroupChat && (
              <GroupInfoPanel onClose={() => setShowGroupInfo(false)} />
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Select a conversation</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Or start a new one</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              New Chat
            </button>
          </div>
        )}
      </section>

      {showModal && <NewChatModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

export default ChatPage

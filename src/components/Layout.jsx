import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import useChatStore from '../store/useChatStore'

const Layout = () => {
  const { pathname } = useLocation()
  const activeChat = useChatStore((s) => s.activeChat)
  const hideNavbarOnMobile = pathname === '/' && Boolean(activeChat)

  return (
    <div className="flex h-dvh min-h-0 w-full max-w-[1920px] mx-auto overflow-x-hidden flex-col bg-gray-50 dark:bg-gray-950">
      <div className={hideNavbarOnMobile ? 'hidden md:block shrink-0' : 'shrink-0'}>
        <Navbar />
      </div>
      <main className="flex-1 flex min-h-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

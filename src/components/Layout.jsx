import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

const Layout = () => (
  <div className="min-h-screen max-w-full overflow-x-hidden flex flex-col bg-gray-50 dark:bg-gray-950">
    <Navbar />
    <main className="flex-1 flex overflow-hidden">
      <Outlet />
    </main>
  </div>
)

export default Layout

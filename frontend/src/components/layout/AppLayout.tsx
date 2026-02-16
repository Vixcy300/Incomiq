import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

export default function AppLayout() {
  const { settings } = useAppStore()

  return (
    <div className="flex h-screen overflow-hidden bg-[#111111]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className={cn(
          "flex-1 overflow-y-auto p-6",
          settings.darkMode ? "bg-[#111111]" : "bg-gray-50"
        )}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

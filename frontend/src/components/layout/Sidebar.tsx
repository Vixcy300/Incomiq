import { NavLink, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  Landmark,
  Target,
  TrendingUp,
  Bot,
  Settings,
  LogOut,
  ChevronLeft,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'

type TranslationKey = 'nav_dashboard' | 'nav_income' | 'nav_expenses' | 'nav_rules' | 'nav_goals' | 'nav_investments' | 'nav_ai_chat' | 'nav_admin' | 'nav_settings'

const navItems: { to: string; labelKey: TranslationKey; icon: typeof LayoutDashboard; navKey: string; adminOnly?: boolean }[] = [
  { to: '/', labelKey: 'nav_dashboard', icon: LayoutDashboard, navKey: 'dashboard' },
  { to: '/income', labelKey: 'nav_income', icon: Wallet, navKey: 'income' },
  { to: '/expenses', labelKey: 'nav_expenses', icon: CreditCard, navKey: 'expenses' },
  { to: '/rules', labelKey: 'nav_rules', icon: Landmark, navKey: 'rules' },
  { to: '/goals', labelKey: 'nav_goals', icon: Target, navKey: 'goals' },
  { to: '/investments', labelKey: 'nav_investments', icon: TrendingUp, navKey: 'investments' },
  { to: '/ai-chat', labelKey: 'nav_ai_chat', icon: Bot, navKey: 'ai-chat' },
  { to: '/admin', labelKey: 'nav_admin', icon: Shield, navKey: 'admin', adminOnly: true },
  { to: '/settings', labelKey: 'nav_settings', icon: Settings, navKey: 'settings' },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, setUser, user } = useAppStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Check if user is admin
  const isAdmin = user?.email && ['admin@incomiq.com', 'rahul@demo.com'].includes(user.email)

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
    navigate('/login')
  }

  return (
    <aside
      className={cn(
        'relative h-full bg-[#0a0a0a] border-r border-white/5 flex flex-col will-change-[width]',
        'transition-[width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* Collapse Toggle Arrow - Centered vertically */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 bg-[#1a1a1a] border border-white/10 rounded-full flex items-center justify-center hover:bg-[#2a2a2a] hover:border-purple-500/50 transition-all duration-300 ease-out group hover:scale-110 active:scale-95"
      >
        <ChevronLeft className={cn(
          "w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-all duration-300",
          !sidebarOpen && "rotate-180"
        )} />
      </button>

      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-white/5 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className={cn(
            "font-bold text-xl text-white tracking-tight whitespace-nowrap transition-all duration-500 ease-out",
            sidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
          )}>
            Incomiq
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.filter(item => {
          // Admin users only see Admin + Settings
          if (isAdmin) return item.adminOnly || item.navKey === 'settings'
          // Regular users don't see admin-only items
          return !item.adminOnly
        }).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            data-nav={item.navKey}
            className={({ isActive }) =>
              cn(
                'sidebar-link group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                'transition-all duration-300 ease-out',
                sidebarOpen ? 'justify-start' : 'justify-center',
                isActive
                  ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border border-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )
            }
          >
            <item.icon className={cn(
              "w-5 h-5 flex-shrink-0 transition-all duration-300",
              "group-hover:text-purple-400 group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
            )} />
            <span className={cn(
              "whitespace-nowrap transition-all duration-500 ease-out",
              sidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0 overflow-hidden"
            )}>
              {t(item.labelKey)}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 overflow-hidden">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out",
            "text-gray-400 hover:bg-red-500/10 hover:text-red-400",
            sidebarOpen ? 'justify-start' : 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className={cn(
            "whitespace-nowrap transition-all duration-500 ease-out",
            sidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0 overflow-hidden"
          )}>
            {t('nav_logout')}
          </span>
        </button>
      </div>
    </aside>
  )
}

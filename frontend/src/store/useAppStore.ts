import { create } from 'zustand'
import type { User, SavingsGoal, SavingsRule, DashboardMetrics } from '@/types'

export interface CategoryLimits {
  rent: number
  food: number
  transport: number
  utilities: number
  entertainment: number
  healthcare: number
  education: number
  shopping: number
  bills: number
  other: number
}

export interface UserSettings {
  savingsTarget: number
  monthlyIncome: number
  currency: string
  emailAlerts: boolean
  pushAlerts: boolean
  whatsappAlerts: boolean
  whatsappNumber: string
  overspendAlerts: boolean
  savingsReminders: boolean
  goalNotifications: boolean
  darkMode: boolean
  categoryLimits: CategoryLimits
}

const defaultCategoryLimits: CategoryLimits = {
  rent: 2500,
  food: 2500,
  transport: 1500,
  utilities: 1000,
  entertainment: 1500,
  healthcare: 500,
  education: 500,
  shopping: 2000,
  bills: 2000,
  other: 500,
}

const defaultSettings: UserSettings = {
  savingsTarget: 5000,
  monthlyIncome: 10000,
  currency: '₹',
  emailAlerts: true,
  pushAlerts: true,
  whatsappAlerts: false,
  whatsappNumber: '',
  overspendAlerts: true,
  savingsReminders: true,
  goalNotifications: true,
  darkMode: false,
  categoryLimits: defaultCategoryLimits,
}

interface AppState {
  // Auth
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
  initializeAuth: () => void

  // UI
  sidebarOpen: boolean
  toggleSidebar: () => void

  // Settings
  settings: UserSettings
  updateSettings: (patch: Partial<UserSettings>) => void

  // Dashboard cache
  dashboardMetrics: DashboardMetrics | null
  setDashboardMetrics: (metrics: DashboardMetrics) => void

  // Active goals cache
  activeGoals: SavingsGoal[]
  setActiveGoals: (goals: SavingsGoal[]) => void

  // Active rules cache
  activeRules: SavingsRule[]
  setActiveRules: (rules: SavingsRule[]) => void
}

function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem('incomiq_settings')
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return defaultSettings
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem('incomiq_user')
    const token = localStorage.getItem('access_token')
    if (raw && token) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

const savedUser = loadUser()

export const useAppStore = create<AppState>((set) => ({
  // Auth - initialize from localStorage
  user: savedUser,
  isAuthenticated: !!savedUser,
  setUser: (user) => {
    if (user) {
      localStorage.setItem('incomiq_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('incomiq_user')
      localStorage.removeItem('access_token')
    }
    set({ user, isAuthenticated: !!user })
  },
  logout: () => {
    localStorage.removeItem('incomiq_user')
    localStorage.removeItem('access_token')
    set({ user: null, isAuthenticated: false, dashboardMetrics: null, activeGoals: [], activeRules: [] })
  },
  initializeAuth: () => {
    const user = loadUser()
    set({ user, isAuthenticated: !!user })
  },

  // UI
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Settings
  settings: loadSettings(),
  updateSettings: (patch) =>
    set((state) => {
      const next = { ...state.settings, ...patch }
      localStorage.setItem('incomiq_settings', JSON.stringify(next))
      return { settings: next }
    }),

  // Dashboard
  dashboardMetrics: null,
  setDashboardMetrics: (metrics) => set({ dashboardMetrics: metrics }),

  // Goals
  activeGoals: [],
  setActiveGoals: (goals) => set({ activeGoals: goals }),

  // Rules
  activeRules: [],
  setActiveRules: (rules) => set({ activeRules: rules }),
}))

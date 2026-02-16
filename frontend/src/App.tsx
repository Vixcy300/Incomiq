import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { I18nProvider } from '@/lib/i18n'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import IncomePage from '@/pages/IncomePage'
import ExpensesPage from '@/pages/ExpensesPage'
import RulesPage from '@/pages/RulesPage'
import GoalsPage from '@/pages/GoalsPage'
import InvestmentsPage from '@/pages/InvestmentsPage'
import AIChatPage from '@/pages/AIChatPage'
import SettingsPage from '@/pages/SettingsPage'
import AdminDashboardPage from '@/pages/AdminDashboardPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Apply dark mode from settings on app load
function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useAppStore((s) => s.settings.darkMode)
  
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])
  
  return <>{children}</>
}

function App() {
  return (
    <I18nProvider>
    <QueryClientProvider client={queryClient}>
      <DarkModeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="income" element={<IncomePage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="rules" element={<RulesPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="investments" element={<InvestmentsPage />} />
            <Route path="ai-chat" element={<AIChatPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin" element={<AdminDashboardPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            background: '#fff',
            color: '#111827',
            border: '1px solid #E5E7EB',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)',
            fontSize: '14px',
          },
        }}
      />
      </DarkModeProvider>
    </QueryClientProvider>
    </I18nProvider>
  )
}

export default App

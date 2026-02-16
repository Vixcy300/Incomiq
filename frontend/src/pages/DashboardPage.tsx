import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Wallet, Layers, BarChart3, PiggyBank, TrendingUp, Brain, AlertTriangle, Bell, BellRing, Mail, Sparkles, Settings, ArrowRight, Target } from 'lucide-react'
import MetricCard from '@/components/ui/MetricCard'
import Button from '@/components/ui/Button'
import { GlowMetricCard } from '@/components/ui/GlowCard'
import { formatCurrency } from '@/lib/utils'
import { mockIncomeChartData, mockSpendingBreakdown, mockInsights, mockVolatility } from '@/lib/mockData'
import IncomeChart from '@/components/dashboard/IncomeChart'
import SpendingDonut from '@/components/dashboard/SpendingDonut'
import InsightsPanel from '@/components/dashboard/InsightsPanel'
import VolatilityGauge from '@/components/dashboard/VolatilityGauge'
import HealthScoreGauge from '@/components/dashboard/HealthScoreGauge'
import SpendingStreaks from '@/components/dashboard/SpendingStreaks'
import QuickActions from '@/components/dashboard/QuickActions'
import { analyticsApi } from '@/lib/api'
import { useNotifications } from '@/lib/useNotifications'
import { useTranslation } from '@/lib/i18n'
import { useAppStore } from '@/store/useAppStore'
import toast from 'react-hot-toast'

interface SavingsSuggestion {
  minimum_monthly_saving: number
  recommended_monthly_saving: number
  dirty_expenses: { category: string; amount: number; suggestion: string }[]
  savings_tips: string[]
  savings_score: number
  monthly_budget: Record<string, number>
}

interface DashboardMetrics {
  total_income: number
  total_expenses: number
  total_saved: number
  active_sources: number
  sources_list?: string[]
  avg_daily_income: number
  savings_rate: number
  income_change: number
  expense_change: number
  income_count: number
  expense_count: number
}

// Default streaks data (used as fallback)
const defaultStreaks = [
  { currentStreak: 0, bestStreak: 0, type: 'under_budget' as const },
  { currentStreak: 0, bestStreak: 0, type: 'no_dirty' as const },
  { currentStreak: 0, bestStreak: 0, type: 'daily_track' as const },
  { currentStreak: 0, bestStreak: 0, type: 'savings' as const },
]

export default function DashboardPage() {
  const { t } = useTranslation()
  const { settings } = useAppStore()
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_income: 0,
    total_expenses: 0,
    total_saved: 0,
    active_sources: 0,
    sources_list: [],
    avg_daily_income: 0,
    savings_rate: 0,
    income_change: 0,
    expense_change: 0,
    income_count: 0,
    expense_count: 0,
  })
  const [savings, setSavings] = useState<SavingsSuggestion | null>(null)
  const [insights, setInsights] = useState(mockInsights)
  const [loadingSavings, setLoadingSavings] = useState(false)
  const [loadingMetrics, setLoadingMetrics] = useState(true)
  const [streaks, setStreaks] = useState(defaultStreaks)
  const { permission, requestPermission, showLocalNotification, sendTestEmail } = useNotifications()
  
  // Calculated values from REAL data
  const remainingToInvest = Math.max(0, metrics.total_income - metrics.total_expenses - settings.savingsTarget)
  const savedThisMonth = Math.max(0, metrics.total_income - metrics.total_expenses)
  const savingsProgress = settings.savingsTarget > 0 ? Math.min(100, (savedThisMonth / settings.savingsTarget) * 100) : 0
  
  // Calculate health score based on REAL data
  const calculateHealthScore = () => {
    if (metrics.income_count === 0) return 0 // No data yet
    let score = 50 // Base score
    // Savings progress contributes up to 20 points
    score += Math.min(20, savingsProgress * 0.2)
    // Low dirty expenses contributes up to 15 points
    const dirtyExpenseCount = savings?.dirty_expenses?.length || 0
    score += Math.max(0, 15 - dirtyExpenseCount * 5)
    // Having remaining money to invest contributes up to 15 points
    if (remainingToInvest > 0) score += Math.min(15, (remainingToInvest / 5000) * 15)
    return Math.round(Math.min(100, score))
  }

  // Fetch real dashboard metrics from API
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoadingMetrics(true)
      try {
        const data = await analyticsApi.dashboard()
        setMetrics(data)
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err)
      } finally {
        setLoadingMetrics(false)
      }
    }
    fetchMetrics()
  }, [])

  useEffect(() => {
    // Fetch AI insights from backend
    analyticsApi.insights()
      .then((data) => {
        if (data.insights?.length) setInsights(data.insights)
      })
      .catch(() => {/* use mock data */})
  }, [])

  useEffect(() => {
    // Fetch spending streaks from backend
    analyticsApi.streaks()
      .then((data) => {
        if (data.streaks?.length) {
          // Cast to correct type
          const typedStreaks = data.streaks.map(s => ({
            ...s,
            type: s.type as 'under_budget' | 'no_dirty' | 'daily_track' | 'savings'
          }))
          setStreaks(typedStreaks)
        }
      })
      .catch(() => {/* use default data */})
  }, [])

  const fetchSavingsAnalysis = async () => {
    setLoadingSavings(true)
    try {
      const data = await analyticsApi.savingsSuggestions()
      setSavings(data)
      toast.success('AI savings analysis ready!')
      // Show notification for dirty expenses
      if (data.dirty_expenses?.length > 0) {
        showLocalNotification(
          '⚠️ Dirty Expense Alert!',
          `You have ${data.dirty_expenses.length} non-essential spending categories to review.`,
          { url: '/expenses' }
        )
      }
    } catch {
      toast.error('Could not fetch savings analysis')
    } finally {
      setLoadingSavings(false)
    }
  }

  const handleEnableNotifications = async () => {
    const granted = await requestPermission()
    if (granted) {
      showLocalNotification('🎉 Notifications Enabled!', 'You\'ll now get alerts for overspending and savings reminders.')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('dash_title')}</h1>
          <p className="text-gray-500 mt-1">{t('dash_subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {permission !== 'granted' && (
            <Button variant="outline" size="sm" onClick={handleEnableNotifications} icon={<Bell className="w-4 h-4" />}>
              {t('dash_enable_alerts')}
            </Button>
          )}
          {permission === 'granted' && (
            <Button variant="outline" size="sm" onClick={sendTestEmail} icon={<Mail className="w-4 h-4" />}>
              {t('dash_test_email')}
            </Button>
          )}
          <Button size="sm" onClick={fetchSavingsAnalysis} loading={loadingSavings} icon={<Brain className="w-4 h-4" />}>
            {t('dash_ai_analysis')}
          </Button>
        </div>
      </div>

      {/* Notification banner */}
      {permission === 'granted' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <BellRing className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-700 font-medium">{t('dash_notif_active')}</span>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <QuickActions />
      </motion.div>

      {/* Premium Feature Showcase - Glassmorphism Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-3xl p-6 md:p-8 overflow-hidden relative"
      >
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Quick Stats</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlowMetricCard
              icon={Wallet}
              label="This Month's Income"
              value={formatCurrency(metrics.total_income)}
              subValue={`${metrics.income_count} transactions`}
              trend={metrics.income_count > 0 ? { value: 12, positive: true } : undefined}
              variant="orange"
            />
            <GlowMetricCard
              icon={TrendingUp}
              label="Monthly Expenses"
              value={formatCurrency(metrics.total_expenses)}
              subValue={`${metrics.expense_count} expenses`}
              trend={metrics.expense_count > 0 ? { value: 5, positive: false } : undefined}
              variant="blue"
            />
            <GlowMetricCard
              icon={PiggyBank}
              label="Net Savings"
              value={formatCurrency(savedThisMonth)}
              subValue={`${savingsProgress.toFixed(0)}% of target`}
              trend={savingsProgress >= 50 ? { value: savingsProgress, positive: true } : { value: 100 - savingsProgress, positive: false }}
              variant="green"
            />
          </div>
        </div>
      </motion.div>

      {/* Savings Target + Remaining to Invest Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Savings Target Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">{t('dash_monthly_target')}</h3>
            </div>
            <Link to="/settings" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
              <Settings className="w-3 h-3" /> {t('dash_set_target')}
            </Link>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{formatCurrency(settings.savingsTarget)}</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{formatCurrency(savedThisMonth)} saved</span>
              <span>{savingsProgress.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-emerald-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${savingsProgress}%` }} />
            </div>
          </div>
        </motion.div>

        {/* Remaining to Invest Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">{t('dash_remaining')}</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(remainingToInvest)}</p>
          <p className="text-xs text-gray-500 mt-1">After expenses & savings target</p>
          {remainingToInvest > 0 && (
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <Link
                to="/investments"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                {t('dash_invest_suggestion')}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/ai-chat"
                className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
              >
                <Brain className="w-4 h-4" />
                Chat with AI
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title={t('dash_total_income')}
          value={formatCurrency(metrics.total_income)}
          change={metrics.income_count > 0 ? `${metrics.income_count} entries` : 'No data yet'}
          changeType={metrics.income_count > 0 ? 'positive' : 'neutral'}
          subtitle={metrics.income_count > 0 ? '' : 'Upload CSV to start'}
          icon={<Wallet className="w-6 h-6" />}
          delay={0}
        />
        <MetricCard
          title="Total Spent"
          value={formatCurrency(metrics.total_expenses)}
          change={metrics.expense_count > 0 ? `${metrics.expense_count} expenses` : 'No expenses'}
          changeType={metrics.expense_count > 0 ? 'negative' : 'neutral'}
          icon={<TrendingUp className="w-6 h-6" />}
          delay={0.05}
        />
        <MetricCard
          title={t('dash_active_sources')}
          value={String(metrics.active_sources)}
          change={metrics.sources_list?.length ? `${metrics.sources_list.slice(0,3).join(', ')}` : 'No sources'}
          changeType="neutral"
          icon={<Layers className="w-6 h-6" />}
          delay={0.1}
        />
        <MetricCard
          title={t('dash_avg_daily')}
          value={formatCurrency(metrics.avg_daily_income)}
          change={metrics.income_count > 0 ? `from ${metrics.income_count} incomes` : ''}
          changeType={metrics.avg_daily_income > 0 ? 'positive' : 'neutral'}
          subtitle={''}
          icon={<BarChart3 className="w-6 h-6" />}
          delay={0.2}
        />
        <MetricCard
          title={t('dash_saved_month')}
          value={formatCurrency(savedThisMonth)}
          change={`${savingsProgress.toFixed(0)}% ${t('dash_of_target')}`}
          changeType={savingsProgress >= 50 ? 'positive' : 'negative'}
          icon={<PiggyBank className="w-6 h-6" />}
          delay={0.3}
        />
      </div>

      {/* AI Savings Analysis Panel */}
      {savings && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Min + Recommended Savings */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t('savings_ai_plan')}</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-white/70 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('savings_min')}</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(savings.minimum_monthly_saving)}</p>
                <p className="text-xs text-gray-500 mt-1">{t('savings_essential')}</p>
              </div>
              <div className="bg-white/70 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('savings_recommended')}</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(savings.recommended_monthly_saving)}</p>
                <p className="text-xs text-gray-500 mt-1">{t('savings_faster')}</p>
              </div>
              <div className="bg-white/70 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('savings_score')}</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${savings.savings_score >= 70 ? 'bg-green-500' : savings.savings_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${savings.savings_score}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-gray-900">{savings.savings_score}/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dirty Expenses Alert */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">{t('savings_dirty')}</h3>
            </div>
            {savings.dirty_expenses.length > 0 ? (
              <div className="space-y-3">
                {savings.dirty_expenses.map((dirty, idx) => (
                  <div key={idx} className="bg-white/70 rounded-lg p-3 border-l-4 border-red-400">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-gray-900 capitalize">{dirty.category}</p>
                      <span className="text-sm font-bold text-red-600">{formatCurrency(dirty.amount)}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{dirty.suggestion}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">{t('savings_dirty_none')}</p>
              </div>
            )}
          </div>

          {/* AI Tips */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t('savings_tips')}</h3>
            </div>
            <div className="space-y-3">
              {savings.savings_tips.map((tip, idx) => (
                <div key={idx} className="bg-white/70 rounded-lg p-3 flex gap-3">
                  <span className="text-lg">{['💡', '🎯', '📊', '🔥'][idx] || '💰'}</span>
                  <p className="text-sm text-gray-700">{tip}</p>
                </div>
              ))}
            </div>
            {savings.monthly_budget && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{t('savings_budget')}</p>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(savings.monthly_budget).map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between text-xs bg-white/50 rounded px-2 py-1">
                      <span className="capitalize text-gray-600">{cat}</span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{t('dash_income_over_time')}</h3>
              <p className="text-sm text-gray-500">{t('dash_last_6_months')}</p>
            </div>
            <div className="flex items-center gap-1 text-success-500">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+32% growth</span>
            </div>
          </div>
          <IncomeChart data={mockIncomeChartData} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dash_spending_breakdown')}</h3>
          <SpendingDonut data={mockSpendingBreakdown} />
        </motion.div>
      </div>

      {/* Insights + Volatility Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
          <InsightsPanel insights={insights} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dash_income_volatility')}</h3>
          <VolatilityGauge data={mockVolatility} />
        </motion.div>
      </div>

      {/* Health Score + Spending Streaks Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6 shadow-card flex flex-col items-center justify-center"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Health</h3>
          <HealthScoreGauge score={calculateHealthScore()} size="lg" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="lg:col-span-2"
        >
          <SpendingStreaks streaks={streaks} />
        </motion.div>
      </div>
    </div>
  )
}

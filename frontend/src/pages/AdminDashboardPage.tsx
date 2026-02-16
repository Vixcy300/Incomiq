import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Users,
  TrendingDown,
  AlertTriangle,
  Activity,
  DollarSign,
  CheckCircle,
  XCircle,
  BarChart3,
  FileWarning,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { adminApi } from '@/lib/api'
import { formatCurrency, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface AdminDashboardData {
  summary: {
    total_users: number
    active_users_30d: number
    total_income: number
    total_expenses: number
    total_savings: number
  }
  income_trends: Array<{
    user_id: string
    monthly_data: Record<string, number>
  }>
  low_income_alerts: Array<{
    user_id: string
    avg_monthly_income: number
    period: string
    severity: 'high' | 'medium'
  }>
  large_transactions: Array<{
    user_id: string
    amount: number
    category: string
    date: string
    description: string
  }>
  rule_usage: Record<string, number>
  timestamp: string
}

interface RuleAnalytics {
  total_rules: number
  active_rules: number
  rule_types: Record<string, number>
  condition_types: Record<string, number>
  avg_rules_per_user: number
}

interface ComplianceData {
  total_flagged: number
  transactions: Array<{
    user_id: string
    amount: number
    category: string
    date: string
    description: string
    flag_reason: string
  }>
}

export default function AdminDashboardPage() {
  const { settings } = useAppStore()
  const isDark = settings.darkMode
  
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [ruleAnalytics, setRuleAnalytics] = useState<RuleAnalytics | null>(null)
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'rules' | 'compliance'>('overview')
  const [complianceThreshold, setComplianceThreshold] = useState(50000)

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [dashboard, rules, compliance] = await Promise.all([
        adminApi.dashboard(),
        adminApi.ruleAnalytics(),
        adminApi.complianceChecks(complianceThreshold)
      ])
      
      setDashboardData(dashboard)
      setRuleAnalytics(rules)
      setComplianceData(compliance)
      toast.success('Dashboard data loaded')
    } catch (error) {
      toast.error('Failed to load admin dashboard')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshData = () => {
    loadDashboardData()
  }

  if (loading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        isDark ? "bg-slate-900" : "bg-gray-50"
      )}>
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4"
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <p className={cn("text-sm", isDark ? "text-slate-400" : "text-gray-600")}>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        isDark ? "bg-slate-900" : "bg-gray-50"
      )}>
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className={cn("w-16 h-16 mx-auto mb-4", isDark ? "text-red-400" : "text-red-600")} />
          <h2 className={cn("text-xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>Access Denied</h2>
          <p className={cn("text-sm mb-4", isDark ? "text-slate-400" : "text-gray-600")}>
            You don't have admin privileges. Please log in with an admin account.
          </p>
          <div className={cn(
            "p-4 rounded-xl border text-left space-y-3",
            isDark ? "bg-slate-800 border-slate-700" : "bg-gray-100 border-gray-200"
          )}>
            <div>
              <p className={cn("text-xs font-bold mb-1", isDark ? "text-slate-300" : "text-gray-700")}>Admin Account:</p>
              <p className={cn("text-xs font-mono", isDark ? "text-slate-400" : "text-gray-600")}>Email: admin@incomiq.com</p>
              <p className={cn("text-xs font-mono", isDark ? "text-slate-400" : "text-gray-600")}>Password: 123456789</p>
            </div>
            <div className={cn("pt-2 border-t", isDark ? "border-slate-600" : "border-gray-300")}>
              <p className={cn("text-xs font-bold mb-1", isDark ? "text-slate-300" : "text-gray-700")}>Or use Demo Login:</p>
              <p className={cn("text-xs", isDark ? "text-slate-400" : "text-gray-600")}>Click "Try Demo Account" on login page</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Activity },
    { id: 'alerts' as const, label: 'Alerts', icon: AlertTriangle },
    { id: 'rules' as const, label: 'Rules Analytics', icon: BarChart3 },
    { id: 'compliance' as const, label: 'Compliance', icon: FileWarning },
  ]

  return (
    <div className={cn(
      "min-h-screen p-6",
      isDark ? "bg-slate-900" : "bg-gray-50"
    )}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl gradient-hero flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>Admin Dashboard</h1>
                <p className={cn("text-sm", isDark ? "text-slate-400" : "text-gray-600")}>
                  System analytics & compliance monitoring
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              className={cn(
                "px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all",
                isDark
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              )}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              className={cn(
                "px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 gradient-hero text-white"
              )}
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              label: 'Total Users',
              value: dashboardData.summary.total_users.toLocaleString(),
              icon: Users,
              color: 'blue',
              bgClass: isDark ? 'from-blue-900/30 to-indigo-900/30' : 'from-blue-50 to-indigo-50',
              iconBg: isDark ? 'bg-blue-900' : 'bg-blue-100',
              iconColor: isDark ? 'text-blue-400' : 'text-blue-600'
            },
            {
              label: 'Active (30d)',
              value: dashboardData.summary.active_users_30d.toLocaleString(),
              icon: Activity,
              color: 'green',
              bgClass: isDark ? 'from-emerald-900/30 to-green-900/30' : 'from-emerald-50 to-green-50',
              iconBg: isDark ? 'bg-emerald-900' : 'bg-emerald-100',
              iconColor: isDark ? 'text-emerald-400' : 'text-emerald-600'
            },
            {
              label: 'Total Income',
              value: formatCurrency(dashboardData.summary.total_income),
              icon: DollarSign,
              color: 'purple',
              bgClass: isDark ? 'from-purple-900/30 to-violet-900/30' : 'from-purple-50 to-violet-50',
              iconBg: isDark ? 'bg-purple-900' : 'bg-purple-100',
              iconColor: isDark ? 'text-purple-400' : 'text-purple-600'
            },
            {
              label: 'Total Expenses',
              value: formatCurrency(dashboardData.summary.total_expenses),
              icon: TrendingDown,
              color: 'orange',
              bgClass: isDark ? 'from-orange-900/30 to-amber-900/30' : 'from-orange-50 to-amber-50',
              iconBg: isDark ? 'bg-orange-900' : 'bg-orange-100',
              iconColor: isDark ? 'text-orange-400' : 'text-orange-600'
            },
            {
              label: 'Total Savings',
              value: formatCurrency(dashboardData.summary.total_savings),
              icon: CheckCircle,
              color: 'teal',
              bgClass: isDark ? 'from-teal-900/30 to-cyan-900/30' : 'from-teal-50 to-cyan-50',
              iconBg: isDark ? 'bg-teal-900' : 'bg-teal-100',
              iconColor: isDark ? 'text-teal-400' : 'text-teal-600'
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "rounded-2xl p-4 border bg-gradient-to-br",
                stat.bgClass,
                isDark ? "border-slate-700" : "border-gray-200"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.iconBg)}>
                  <stat.icon className={cn("w-5 h-5", stat.iconColor)} />
                </div>
              </div>
              <p className={cn("text-xs font-medium mb-1", isDark ? "text-slate-400" : "text-gray-600")}>
                {stat.label}
              </p>
              <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className={cn(
          "flex gap-2 p-1 rounded-xl border",
          isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
        )}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-gradient-to-r from-primary-500 to-indigo-500 text-white shadow-lg"
                  : isDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Income Trends */}
              <div className={cn(
                "rounded-2xl p-6 border",
                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
              )}>
                <h3 className={cn("text-lg font-bold mb-4", isDark ? "text-white" : "text-gray-900")}>
                  Anonymized Income Trends (Top 10 Users)
                </h3>
                <div className="space-y-4">
                  {dashboardData.income_trends.slice(0, 5).map((trend, i) => (
                    <div key={i} className={cn(
                      "p-4 rounded-xl border",
                      isDark ? "bg-slate-900/50 border-slate-700" : "bg-gray-50 border-gray-200"
                    )}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={cn("font-mono text-sm", isDark ? "text-slate-300" : "text-gray-700")}>
                          {trend.user_id}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {Object.entries(trend.monthly_data).map(([month, amount]) => (
                          <div key={month} className="flex-1 text-center">
                            <div className={cn(
                              "h-20 rounded-lg mb-1 flex items-end justify-center p-2",
                              isDark ? "bg-primary-900/30" : "bg-primary-100"
                            )}>
                              <div
                                className="w-full bg-gradient-to-t from-primary-500 to-indigo-500 rounded"
                                style={{ height: `${Math.min((amount / 50000) * 100, 100)}%` }}
                              />
                            </div>
                            <p className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-gray-600")}>
                              {month.split('-')[1]}
                            </p>
                            <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-gray-900")}>
                              {formatCurrency(amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rule Usage */}
              {ruleAnalytics && (
                <div className={cn(
                  "rounded-2xl p-6 border",
                  isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
                )}>
                  <h3 className={cn("text-lg font-bold mb-4", isDark ? "text-white" : "text-gray-900")}>
                    Quick Rule Stats
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={cn(
                      "p-4 rounded-xl text-center",
                      isDark ? "bg-slate-900/50" : "bg-gray-50"
                    )}>
                      <p className={cn("text-2xl font-bold mb-1", isDark ? "text-white" : "text-gray-900")}>
                        {ruleAnalytics.total_rules}
                      </p>
                      <p className={cn("text-xs", isDark ? "text-slate-400" : "text-gray-600")}>Total Rules</p>
                    </div>
                    <div className={cn(
                      "p-4 rounded-xl text-center",
                      isDark ? "bg-emerald-900/20" : "bg-emerald-50"
                    )}>
                      <p className="text-2xl font-bold mb-1 text-emerald-600">
                        {ruleAnalytics.active_rules}
                      </p>
                      <p className={cn("text-xs", isDark ? "text-slate-400" : "text-gray-600")}>Active Rules</p>
                    </div>
                    <div className={cn(
                      "p-4 rounded-xl text-center",
                      isDark ? "bg-blue-900/20" : "bg-blue-50"
                    )}>
                      <p className="text-2xl font-bold mb-1 text-blue-600">
                        {ruleAnalytics.avg_rules_per_user.toFixed(1)}
                      </p>
                      <p className={cn("text-xs", isDark ? "text-slate-400" : "text-gray-600")}>Avg per User</p>
                    </div>
                    <div className={cn(
                      "p-4 rounded-xl text-center",
                      isDark ? "bg-purple-900/20" : "bg-purple-50"
                    )}>
                      <p className="text-2xl font-bold mb-1 text-purple-600">
                        {Object.keys(ruleAnalytics.rule_types).length}
                      </p>
                      <p className={cn("text-xs", isDark ? "text-slate-400" : "text-gray-600")}>Rule Types</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-6">
              {/* Low Income Alerts */}
              <div className={cn(
                "rounded-2xl p-6 border",
                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
              )}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                    Prolonged Low-Income Alerts
                  </h3>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-600"
                  )}>
                    {dashboardData.low_income_alerts.length} Alerts
                  </span>
                </div>
                <div className="space-y-3">
                  {dashboardData.low_income_alerts.map((alert, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border",
                        alert.severity === 'high'
                          ? isDark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"
                          : isDark ? "bg-orange-900/20 border-orange-800" : "bg-orange-50 border-orange-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={cn(
                          "w-5 h-5",
                          alert.severity === 'high'
                            ? isDark ? "text-red-400" : "text-red-600"
                            : isDark ? "text-orange-400" : "text-orange-600"
                        )} />
                        <div>
                          <p className={cn("font-mono text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>
                            {alert.user_id}
                          </p>
                          <p className={cn("text-xs", isDark ? "text-slate-400" : "text-gray-600")}>
                            {alert.period} • Avg: {formatCurrency(alert.avg_monthly_income)}/month
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-bold uppercase",
                        alert.severity === 'high'
                          ? isDark ? "bg-red-900 text-red-200" : "bg-red-600 text-white"
                          : isDark ? "bg-orange-900 text-orange-200" : "bg-orange-600 text-white"
                      )}>
                        {alert.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Large Transactions */}
              <div className={cn(
                "rounded-2xl p-6 border",
                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
              )}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                    Large Transactions (Auto-flagged)
                  </h3>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    isDark ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-600"
                  )}>
                    {dashboardData.large_transactions.length} Flagged
                  </span>
                </div>
                <div className="space-y-2">
                  {dashboardData.large_transactions.slice(0, 10).map((txn, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        isDark ? "bg-slate-900/50 border-slate-700" : "bg-gray-50 border-gray-200"
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-mono text-xs", isDark ? "text-slate-400" : "text-gray-500")}>
                            {txn.user_id}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            isDark ? "bg-slate-700 text-slate-300" : "bg-gray-200 text-gray-700"
                          )}>
                            {txn.category}
                          </span>
                        </div>
                        <p className={cn("text-xs mt-1", isDark ? "text-slate-500" : "text-gray-500")}>
                          {txn.description} • {txn.date}
                        </p>
                      </div>
                      <p className={cn("text-sm font-bold", isDark ? "text-red-400" : "text-red-600")}>
                        {formatCurrency(txn.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && ruleAnalytics && (
            <div className="space-y-6">
              {/* Rule Types Distribution */}
              <div className={cn(
                "rounded-2xl p-6 border",
                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
              )}>
                <h3 className={cn("text-lg font-bold mb-4", isDark ? "text-white" : "text-gray-900")}>
                  Rule Types Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(ruleAnalytics.rule_types).map(([type, count]) => (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn("text-sm font-medium", isDark ? "text-slate-300" : "text-gray-700")}>
                          {type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>
                          {count}
                        </span>
                      </div>
                      <div className={cn(
                        "h-2 rounded-full overflow-hidden",
                        isDark ? "bg-slate-700" : "bg-gray-200"
                      )}>
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-indigo-500"
                          style={{ width: `${(count / ruleAnalytics.total_rules) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Condition Types */}
              <div className={cn(
                "rounded-2xl p-6 border",
                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
              )}>
                <h3 className={cn("text-lg font-bold mb-4", isDark ? "text-white" : "text-gray-900")}>
                  Top Condition Types
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(ruleAnalytics.condition_types).slice(0, 6).map(([condition, count]) => (
                    <div
                      key={condition}
                      className={cn(
                        "p-4 rounded-xl text-center border",
                        isDark ? "bg-slate-900/50 border-slate-700" : "bg-gray-50 border-gray-200"
                      )}
                    >
                      <p className={cn("text-2xl font-bold mb-1", isDark ? "text-white" : "text-gray-900")}>
                        {count}
                      </p>
                      <p className={cn("text-xs", isDark ? "text-slate-400" : "text-gray-600")}>
                        {condition.replace(/_/g, ' ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && complianceData && (
            <div className="space-y-6">
              {/* Threshold Filter */}
              <div className={cn(
                "rounded-2xl p-6 border",
                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
              )}>
                <div className="flex items-center gap-4">
                  <Filter className={cn("w-5 h-5", isDark ? "text-slate-400" : "text-gray-600")} />
                  <div className="flex-1">
                    <label className={cn("text-sm font-medium mb-2 block", isDark ? "text-slate-300" : "text-gray-700")}>
                      Compliance Threshold
                    </label>
                    <input
                      type="number"
                      value={complianceThreshold}
                      onChange={(e) => setComplianceThreshold(Number(e.target.value))}
                      className={cn(
                        "w-full px-4 py-2 rounded-xl border text-sm",
                        isDark
                          ? "bg-slate-900 border-slate-700 text-white"
                          : "bg-white border-gray-200 text-gray-900"
                      )}
                      placeholder="50000"
                    />
                  </div>
                  <button
                    onClick={loadDashboardData}
                    className="px-4 py-2 gradient-hero text-white rounded-xl font-medium text-sm"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Flagged Transactions */}
              <div className={cn(
                "rounded-2xl p-6 border",
                isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
              )}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                    Compliance Checks
                  </h3>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    isDark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-600"
                  )}>
                    {complianceData.total_flagged} Flagged
                  </span>
                </div>
                <div className="space-y-2">
                  {complianceData.transactions.slice(0, 20).map((txn, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border",
                        txn.amount > 100000
                          ? isDark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"
                          : isDark ? "bg-orange-900/20 border-orange-800" : "bg-orange-50 border-orange-200"
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("font-mono text-xs font-medium", isDark ? "text-white" : "text-gray-900")}>
                            {txn.user_id}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            isDark ? "bg-slate-700 text-slate-300" : "bg-gray-200 text-gray-700"
                          )}>
                            {txn.category}
                          </span>
                        </div>
                        <p className={cn("text-xs mb-1", isDark ? "text-slate-300" : "text-gray-700")}>
                          {txn.description}
                        </p>
                        <p className={cn("text-xs", isDark ? "text-slate-500" : "text-gray-500")}>
                          {txn.date} • {txn.flag_reason}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-lg font-bold",
                          txn.amount > 100000
                            ? isDark ? "text-red-400" : "text-red-600"
                            : isDark ? "text-orange-400" : "text-orange-600"
                        )}>
                          {formatCurrency(txn.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

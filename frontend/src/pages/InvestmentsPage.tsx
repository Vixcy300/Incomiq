import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Shield,
  TrendingUp,
  ChevronRight,
  PiggyBank,
  Landmark,
  Coins,
  BarChart3,
  RefreshCw,
  ArrowRight,
  CircleCheck,
  Info,
  Zap,
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { mockInvestmentRecommendation } from '@/lib/mockData'
import { useTranslation } from '@/lib/i18n'
import { useAppStore } from '@/store/useAppStore'
import { investmentApi } from '@/lib/api'
import toast from 'react-hot-toast'
import type { RiskProfile, InvestmentRecommendation } from '@/types'

// ── Quiz Questions ──
const quizQuestions = [
  {
    id: 'q1',
    question: "What's your investment experience?",
    icon: '📚',
    options: [
      { label: 'Complete beginner', emoji: '🌱', value: 0 },
      { label: 'Some knowledge', emoji: '📖', value: 1 },
      { label: 'Experienced investor', emoji: '🎓', value: 2 },
    ],
  },
  {
    id: 'q2',
    question: 'How would you react if your investment dropped 20%?',
    icon: '📉',
    options: [
      { label: 'Panic and sell', emoji: '😰', value: 0 },
      { label: 'Hold and wait', emoji: '🧘', value: 1 },
      { label: 'Buy more!', emoji: '💪', value: 2 },
    ],
  },
  {
    id: 'q3',
    question: "What's your investment timeline?",
    icon: '⏱️',
    options: [
      { label: 'Less than 1 year', emoji: '🏃', value: 0 },
      { label: '1-3 years', emoji: '🚶', value: 1 },
      { label: '3-5 years', emoji: '🧗', value: 2 },
      { label: '5+ years', emoji: '🏔️', value: 3 },
    ],
  },
  {
    id: 'q4',
    question: 'What percentage of savings can you invest?',
    icon: '💰',
    options: [
      { label: 'Less than 25%', emoji: '🪙', value: 0 },
      { label: '25-50%', emoji: '💵', value: 1 },
      { label: '50-75%', emoji: '💳', value: 2 },
      { label: 'More than 75%', emoji: '💎', value: 3 },
    ],
  },
  {
    id: 'q5',
    question: 'Which best describes you?',
    icon: '🎯',
    options: [
      { label: 'I want guaranteed returns', emoji: '🔒', value: 0 },
      { label: 'Moderate risk is okay', emoji: '⚖️', value: 1 },
      { label: 'Maximum growth please!', emoji: '🚀', value: 2 },
    ],
  },
]

function calculateRiskProfile(answers: Record<string, number>): { profile: RiskProfile; score: number } {
  const score =
    (answers.q1 || 0) * 1 +
    (answers.q2 || 0) * 2 +
    (answers.q3 || 0) * 1 +
    (answers.q4 || 0) * 1 +
    (answers.q5 || 0) * 2
  if (score <= 5) return { profile: 'conservative', score }
  if (score <= 10) return { profile: 'moderate', score }
  return { profile: 'aggressive', score }
}

const profileConfig = {
  conservative: {
    color: 'emerald',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    textClass: 'text-emerald-600',
    icon: Shield,
    emoji: '🛡️',
    description: 'Safe & steady - perfect for building a stable foundation',
  },
  moderate: {
    color: 'amber',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-600',
    icon: BarChart3,
    emoji: '⚖️',
    description: 'Balanced approach - good mix of safety and growth',
  },
  aggressive: {
    color: 'rose',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
    textClass: 'text-rose-600',
    icon: TrendingUp,
    emoji: '🚀',
    description: 'High growth potential - for long-term wealth building',
  },
}

const investmentIcons: Record<string, typeof PiggyBank> = {
  mutual_fund: BarChart3,
  stock: TrendingUp,
  etf: Coins,
  fd: Landmark,
  gold: Coins,
}

export default function InvestmentsPage() {
  const { t } = useTranslation()
  const { settings } = useAppStore()
  const [step, setStep] = useState(0) // 0=start, 1-5=quiz, 6=results
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [recommendation, setRecommendation] = useState<InvestmentRecommendation | null>(null)
  const [riskProfile, setRiskProfile] = useState<{ profile: RiskProfile; score: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiRecommendation, setAiRecommendation] = useState<string>('')
  const [aiTopPicks, setAiTopPicks] = useState<{ name: string; expected_returns: string; reason: string }[]>([])
  const [monthlySipAmount, setMonthlySipAmount] = useState<number>(0)
  const [userData, setUserData] = useState<{ total_income: number; total_expenses: number; monthly_savings: number; goals_count: number } | null>(null)
  // Return projection calculator state
  const [expandedProjection, setExpandedProjection] = useState<number | null>(null)
  const [projectionAmount, setProjectionAmount] = useState<number>(0)
  const [projectionYears, setProjectionYears] = useState<number>(1)
  const isDark = settings.darkMode

  const monthlyBudget = Math.max(0, settings.monthlyIncome - (settings.monthlyIncome * 0.6)) // 40% for investment

  // Calculate compound returns for projection
  const calculateProjectedReturn = (principal: number, rate: number, years: number) => {
    // Simple compound interest: A = P(1 + r)^n
    const futureValue = principal * Math.pow(1 + rate / 100, years)
    const totalReturn = futureValue - principal
    return { futureValue, totalReturn }
  }

  // Toggle projection calculator for an investment card
  const toggleProjection = (index: number, recommendedAmount: number) => {
    if (expandedProjection === index) {
      setExpandedProjection(null)
    } else {
      setExpandedProjection(index)
      setProjectionAmount(recommendedAmount)
      setProjectionYears(1)
    }
  }

  const startQuiz = () => setStep(1)

  const submitQuizToBackend = async (finalAnswers: Record<string, number>) => {
    setLoading(true)
    try {
      // Call backend with quiz answers to get AI-powered recommendations
      const result = await investmentApi.submitQuiz({
        q1: finalAnswers.q1 || 0,
        q2: finalAnswers.q2 || 0,
        q3: finalAnswers.q3 || 0,
        q4: finalAnswers.q4 || 0,
        q5: finalAnswers.q5 || 0,
      })
      
      // Set profile from backend
      setRiskProfile({
        profile: result.risk_profile as RiskProfile,
        score: result.risk_score,
      })
      
      // Capture user's real financial data from backend
      if (result.user_data) {
        setUserData(result.user_data)
      }
      
      // Set AI recommendation from backend (real Groq AI)
      if (result.ai_recommendation) {
        setAiRecommendation(result.ai_recommendation)
      }
      if (result.top_picks) {
        setAiTopPicks(result.top_picks)
      }
      if (result.monthly_sip_amount) {
        setMonthlySipAmount(result.monthly_sip_amount)
      }
      
      // Use backend options if available, else fallback
      setRecommendation({
        ...mockInvestmentRecommendation,
        risk_profile: result.risk_profile as RiskProfile,
        recommended_allocation: result.allocation || mockInvestmentRecommendation.recommended_allocation,
        investment_options: result.options || mockInvestmentRecommendation.investment_options,
      })
      
      toast.success('AI analysis complete!')
    } catch (error) {
      console.error('Quiz submission failed:', error)
      // Fallback to local calculation
      const localResult = calculateRiskProfile(finalAnswers)
      setRiskProfile(localResult)
      setRecommendation(mockInvestmentRecommendation)
      setAiRecommendation(`Based on your income of ${formatCurrency(settings.monthlyIncome)}, we recommend investing ${formatCurrency(monthlyBudget)} monthly. With a ${localResult.profile} profile, focus on stable returns with minimal risk.`)
    } finally {
      setLoading(false)
      setStep(quizQuestions.length + 1)
    }
  }

  const answerQuestion = (questionId: string, value: number) => {
    const newAnswers = { ...answers, [questionId]: value }
    setAnswers(newAnswers)

    if (step < quizQuestions.length) {
      setTimeout(() => setStep(step + 1), 200)
    } else {
      // Final question - submit to backend for AI analysis
      submitQuizToBackend(newAnswers)
    }
  }

  const skipQuiz = async () => {
    setLoading(true)
    try {
      const result = await investmentApi.recommendations()
      setRiskProfile({ profile: result.risk_profile as RiskProfile, score: result.risk_score || 50 })
      setRecommendation({
        ...mockInvestmentRecommendation,
        risk_profile: result.risk_profile as RiskProfile,
        recommended_allocation: result.allocation || mockInvestmentRecommendation.recommended_allocation,
        investment_options: result.options || mockInvestmentRecommendation.investment_options,
      })
      setAiRecommendation(result.ai_recommendation || `With your monthly income of ${formatCurrency(settings.monthlyIncome)}, you can invest up to ${formatCurrency(monthlyBudget)} per month. Start with a balanced portfolio for steady growth.`)
    } catch {
      setRiskProfile({ profile: 'moderate', score: 7 })
      setRecommendation(mockInvestmentRecommendation)
      setAiRecommendation(`Your monthly income is ${formatCurrency(settings.monthlyIncome)}. Consider investing ${formatCurrency(monthlyBudget)} monthly in a mix of mutual funds and fixed deposits for balanced growth.`)
    } finally {
      setLoading(false)
      setStep(quizQuestions.length + 1)
    }
  }

  const retakeQuiz = () => {
    setStep(0)
    setAnswers({})
    setRiskProfile(null)
    setRecommendation(null)
  }

  // ── Start Screen ──
  if (step === 0) {
    return (
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-3xl border shadow-elevated p-8 md:p-12",
            isDark 
              ? "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-slate-700" 
              : "bg-gradient-to-br from-primary-50 via-white to-emerald-50 border-gray-200"
          )}
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <TrendingUp className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className={cn("text-2xl md:text-3xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>{t('inv_title')}</h1>
            <p className={cn("mb-8 max-w-md mx-auto text-base", isDark ? "text-slate-300" : "text-gray-600")}>
              {t('inv_subtitle')}
            </p>

            {/* Steps Preview */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    isDark ? "bg-primary-900 text-primary-300" : "bg-primary-100 text-primary-600"
                  )}>
                    {n}
                  </div>
                  {n < 5 && <ChevronRight className={cn("w-4 h-4", isDark ? "text-slate-600" : "text-gray-300")} />}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={startQuiz}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 gradient-hero text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-sm"
              >
                <Sparkles className="w-4 h-4" />
                {t('inv_take_quiz')}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={skipQuiz}
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-6 py-3.5 font-medium rounded-2xl border transition-all text-sm",
                  isDark 
                    ? "text-slate-300 border-slate-600 hover:bg-slate-800" 
                    : "text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                {t('inv_skip')}
              </button>
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {[
              { icon: '🎯', title: 'Personalized', desc: 'Based on your risk profile' },
              { icon: '🤖', title: 'AI-Powered', desc: 'Smart recommendations' },
              { icon: '📊', title: 'Clear Plan', desc: 'Easy to follow allocation' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={cn(
                  "backdrop-blur rounded-xl p-4 text-center border",
                  isDark 
                    ? "bg-slate-800/80 border-slate-700" 
                    : "bg-white/80 border-gray-100"
                )}
              >
                <span className="text-2xl">{f.icon}</span>
                <p className={cn("font-semibold mt-2 text-sm", isDark ? "text-white" : "text-gray-900")}>{f.title}</p>
                <p className={cn("text-xs", isDark ? "text-slate-400" : "text-gray-500")}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Loading Screen ──
  if (loading) {
    return (
      <div className="max-w-xl mx-auto mt-8 px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "rounded-3xl border shadow-elevated p-12 text-center",
            isDark 
              ? "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border-slate-700" 
              : "bg-gradient-to-br from-primary-50 via-white to-blue-50 border-gray-200"
          )}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-6"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className={cn("text-lg font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>AI is Analyzing Your Profile...</h2>
          <p className={cn("mb-4 text-sm", isDark ? "text-slate-300" : "text-gray-600")}>
            Based on your income of {formatCurrency(settings.monthlyIncome)}, we're crafting personalized recommendations
          </p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ delay: i * 0.2, duration: 0.6, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-primary-500"
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Quiz Questions ──
  if (step <= quizQuestions.length) {
    const q = quizQuestions[step - 1]
    const progress = (step / quizQuestions.length) * 100

    return (
      <div className="max-w-xl mx-auto mt-8 px-4">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className={cn("text-sm font-medium", isDark ? "text-slate-300" : "text-gray-600")}>
              Question {step} of {quizQuestions.length}
            </span>
            <button onClick={skipQuiz} className={cn("text-sm hover:opacity-80", isDark ? "text-slate-400" : "text-gray-400")}>
              Skip quiz →
            </button>
          </div>
          <div className={cn("rounded-full h-2 overflow-hidden", isDark ? "bg-slate-700" : "bg-gray-200")}>
            <motion.div
              className="h-full gradient-hero"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          {/* Step indicators */}
          <div className="flex justify-between mt-3">
            {quizQuestions.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                  i + 1 < step
                    ? 'bg-primary-500 text-white'
                    : i + 1 === step
                    ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-400'
                    : isDark ? 'bg-slate-700 text-slate-500' : 'bg-gray-100 text-gray-400'
                )}
              >
                {i + 1 < step ? <CircleCheck className="w-5 h-5" /> : i + 1}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "rounded-3xl border shadow-elevated p-6 md:p-8",
              isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            )}
          >
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">{q.icon}</span>
              <h2 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>{q.question}</h2>
            </div>

            <div className="space-y-3">
              {q.options.map((opt) => (
                <motion.button
                  key={opt.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => answerQuestion(q.id, opt.value)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200',
                    answers[q.id] === opt.value
                      ? 'border-primary-500 bg-primary-50'
                      : isDark 
                        ? 'border-slate-600 hover:border-primary-400 hover:bg-slate-700' 
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className={cn("text-left font-medium text-sm", isDark ? "text-white" : "text-gray-800")}>{opt.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ── Results Screen ──
  if (!recommendation || !riskProfile) return null

  const config = profileConfig[riskProfile.profile]

  const allocationData = [
    { name: 'Emergency Fund', pct: recommendation.recommended_allocation.emergency_fund, color: '#3B82F6', icon: '🛡️' },
    { name: 'Low Risk', pct: recommendation.recommended_allocation.low_risk, color: '#10B981', icon: '🌱' },
    { name: 'Medium Risk', pct: recommendation.recommended_allocation.medium_risk, color: '#F59E0B', icon: '⚖️' },
    { name: 'High Risk', pct: recommendation.recommended_allocation.high_risk, color: '#EF4444', icon: '🚀' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>{t('inv_title')}</h1>
        <p className={cn("mt-1", isDark ? "text-slate-400" : "text-gray-500")}>{t('inv_subtitle')}</p>
      </motion.div>

      {/* Risk Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          'rounded-3xl p-6 md:p-8 border-2',
          config.bgClass,
          config.borderClass
        )}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className={cn('w-20 h-20 rounded-2xl flex items-center justify-center', config.bgClass)}>
            <span className="text-5xl">{config.emoji}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-sm font-semibold uppercase tracking-wide', config.textClass)}>
                {t('inv_risk_profile')}
              </span>
            </div>
            <h2 className={cn("text-3xl font-bold capitalize mb-1", isDark ? "text-white" : "text-gray-900")}>
              {t(`inv_${riskProfile.profile}` as 'inv_conservative' | 'inv_moderate' | 'inv_aggressive')}
            </h2>
            <p className={cn(isDark ? "text-slate-300" : "text-gray-600")}>{config.description}</p>
          </div>
          <button
            onClick={retakeQuiz}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-all",
              isDark 
                ? "text-slate-300 bg-slate-800 border-slate-600 hover:bg-slate-700" 
                : "text-gray-600 bg-white border-gray-200 hover:bg-gray-50"
            )}
          >
            <RefreshCw className="w-4 h-4" />
            {t('inv_retake')}
          </button>
        </div>
      </motion.div>

      {/* Your Financial Summary (Real Data) */}
      {userData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={cn(
            "rounded-2xl border p-6",
            isDark ? "bg-slate-800 border-slate-700" : "bg-gradient-to-br from-blue-50 to-emerald-50 border-blue-200"
          )}
        >
          <h3 className={cn("font-semibold mb-4 flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
            <PiggyBank className="w-5 h-5 text-primary-500" />
            Your Financial Summary (Real Data)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={cn("p-4 rounded-xl", isDark ? "bg-slate-700" : "bg-white/80")}>
              <p className={cn("text-xs font-medium mb-1", isDark ? "text-slate-400" : "text-gray-500")}>Total Income</p>
              <p className={cn("text-xl font-bold", isDark ? "text-emerald-400" : "text-emerald-600")}>
                {formatCurrency(userData.total_income)}
              </p>
            </div>
            <div className={cn("p-4 rounded-xl", isDark ? "bg-slate-700" : "bg-white/80")}>
              <p className={cn("text-xs font-medium mb-1", isDark ? "text-slate-400" : "text-gray-500")}>Total Expenses</p>
              <p className={cn("text-xl font-bold", isDark ? "text-red-400" : "text-red-600")}>
                {formatCurrency(userData.total_expenses)}
              </p>
            </div>
            <div className={cn("p-4 rounded-xl", isDark ? "bg-slate-700" : "bg-white/80")}>
              <p className={cn("text-xs font-medium mb-1", isDark ? "text-slate-400" : "text-gray-500")}>Available for Investment</p>
              <p className={cn("text-xl font-bold", isDark ? "text-blue-400" : "text-primary-600")}>
                {formatCurrency(userData.monthly_savings)}
              </p>
            </div>
            <div className={cn("p-4 rounded-xl", isDark ? "bg-slate-700" : "bg-white/80")}>
              <p className={cn("text-xs font-medium mb-1", isDark ? "text-slate-400" : "text-gray-500")}>Active Goals</p>
              <p className={cn("text-xl font-bold", isDark ? "text-amber-400" : "text-amber-600")}>
                {userData.goals_count}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Allocation + AI Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Allocation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "rounded-2xl border p-6",
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          )}
        >
          <h3 className={cn("font-semibold mb-4 flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
            <BarChart3 className="w-5 h-5 text-primary-500" />
            {t('inv_allocation')}
          </h3>
          <div className="space-y-4">
            {allocationData.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("flex items-center gap-2 text-sm font-medium", isDark ? "text-slate-300" : "text-gray-700")}>
                    <span>{item.icon}</span> {item.name}
                  </span>
                  <span className="text-sm font-bold" style={{ color: item.color }}>
                    {item.pct}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatCurrency(monthlyBudget * item.pct / 100)}/mo
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Summary + Budget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          {/* AI Card - Real AI Recommendation */}
          <div className={cn(
            "rounded-2xl border p-6",
            isDark 
              ? "bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700" 
              : "bg-gradient-to-br from-primary-50 to-blue-50 border-primary-100"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary-500" />
              <h3 className={cn("font-semibold text-sm", isDark ? "text-white" : "text-gray-900")}>{t('inv_ai_rec')}</h3>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full ml-auto",
                isDark ? "bg-primary-900 text-primary-300" : "bg-primary-100 text-primary-600"
              )}>
                AI Powered
              </span>
            </div>
            <p className={cn("text-sm leading-relaxed", isDark ? "text-slate-300" : "text-gray-700")}>
              {aiRecommendation || recommendation.ai_summary}
            </p>
            {monthlySipAmount > 0 && (
              <div className={cn("mt-4 pt-4 border-t", isDark ? "border-slate-700" : "border-primary-200")}>
                <p className={cn("text-sm font-medium", isDark ? "text-slate-200" : "text-gray-800")}>
                  💰 Recommended Monthly SIP: <span className="text-primary-500 font-bold">{formatCurrency(monthlySipAmount)}</span>
                </p>
              </div>
            )}
          </div>

          {/* Budget Card */}
          <div className={cn(
            "rounded-2xl border p-6",
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
          )}>
            <h3 className={cn("text-sm mb-1", isDark ? "text-slate-400" : "text-gray-500")}>{t('inv_monthly_budget')}</h3>
            <p className="text-2xl font-bold text-primary-600">{formatCurrency(monthlyBudget)}</p>
            <p className={cn("text-xs mt-1", isDark ? "text-slate-500" : "text-gray-400")}>
              40% of your monthly income ({formatCurrency(settings.monthlyIncome)})
            </p>
            <p className={cn("text-xs mt-1 flex items-center gap-1", isDark ? "text-emerald-400" : "text-emerald-600")}>
              <Sparkles className="w-3 h-3" /> AI considers your income level
            </p>
          </div>
        </motion.div>
      </div>

      {/* AI Top Picks - If available from AI */}
      {aiTopPicks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <h3 className={cn("font-semibold mb-4 flex items-center gap-2 text-sm", isDark ? "text-white" : "text-gray-900")}>
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Top Picks for You
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              isDark ? "bg-purple-900 text-purple-300" : "bg-purple-100 text-purple-600"
            )}>Personalized</span>
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {aiTopPicks.map((pick, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={cn(
                  "rounded-2xl border p-5",
                  isDark 
                    ? "bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-800" 
                    : "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎯</span>
                  <h4 className={cn("font-semibold text-sm", isDark ? "text-white" : "text-gray-900")}>{pick.name}</h4>
                </div>
                <p className={cn("text-xs mb-3", isDark ? "text-slate-300" : "text-gray-600")}>{pick.reason}</p>
                <div className={cn("flex items-center justify-between pt-3 border-t", isDark ? "border-purple-800" : "border-purple-200")}>
                  <span className={cn("text-xs", isDark ? "text-slate-400" : "text-gray-500")}>Expected Returns</span>
                  <span className="font-bold text-emerald-600 text-sm">{pick.expected_returns}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Investment Options */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h3 className={cn("font-semibold mb-4 flex items-center gap-2 text-sm", isDark ? "text-white" : "text-gray-900")}>
          <Zap className="w-5 h-5 text-amber-500" />
          {t('inv_options')}
        </h3>
        <div className="grid gap-4">
          {recommendation.investment_options.map((opt, i) => {
            const Icon = investmentIcons[opt.type] || Coins
            const riskColorClass =
              opt.risk_level === 'low'
                ? 'bg-emerald-100 text-emerald-700'
                : opt.risk_level === 'medium'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-rose-100 text-rose-700'

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.1 }}
                className={cn(
                  "rounded-2xl border p-5 hover:shadow-lg transition-all group",
                  isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
                )}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Icon + Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      isDark ? "bg-primary-900" : "bg-primary-50"
                    )}>
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className={cn("font-semibold text-sm", isDark ? "text-white" : "text-gray-900")}>{opt.name}</h4>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', riskColorClass)}>
                          {opt.risk_level.charAt(0).toUpperCase() + opt.risk_level.slice(1)} Risk
                        </span>
                      </div>
                      <p className={cn("text-xs line-clamp-2", isDark ? "text-slate-400" : "text-gray-500")}>{opt.why_suitable}</p>

                      {/* Pros/Cons */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {opt.pros.slice(0, 2).map((p, j) => (
                          <span key={j} className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                            ✓ {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 md:justify-end">
                    <div className="text-center">
                      <p className={cn("text-xs", isDark ? "text-slate-500" : "text-gray-400")}>Returns</p>
                      <p className="font-bold text-emerald-600 text-sm">{opt.expected_return}</p>
                    </div>
                    <div className="text-center">
                      <p className={cn("text-xs", isDark ? "text-slate-500" : "text-gray-400")}>Invest</p>
                      <p className="font-bold text-primary-600 text-sm">{formatCurrency(opt.recommended_amount)}</p>
                    </div>
                    <div className={cn(
                      "text-center px-4 py-2 rounded-xl",
                      isDark ? "bg-primary-900" : "bg-primary-50"
                    )}>
                      <p className="text-xs text-primary-600">Allocation</p>
                      <p className="text-lg font-bold text-primary-700">{opt.allocation_percentage}%</p>
                    </div>
                  </div>
                </div>

                {/* Calculate Returns Button */}
                <div className={cn("mt-4 pt-4 border-t", isDark ? "border-slate-700" : "border-gray-100")}>
                  <button
                    onClick={() => toggleProjection(i, opt.recommended_amount)}
                    className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <TrendingUp className="w-4 h-4" />
                    {expandedProjection === i ? 'Hide' : 'Calculate'} Return Projections
                    <ChevronRight className={cn('w-4 h-4 transition-transform', expandedProjection === i && 'rotate-90')} />
                  </button>

                  {/* Projection Calculator */}
                  <AnimatePresence>
                    {expandedProjection === i && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                          "mt-4 p-4 rounded-xl border",
                          isDark 
                            ? "bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-800" 
                            : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100"
                        )}
                      >
                        <h5 className={cn("font-semibold mb-3 flex items-center gap-2 text-sm", isDark ? "text-white" : "text-gray-900")}>
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          Investment Return Calculator
                        </h5>
                        
                        {/* Amount Input */}
                        <div className="mb-4">
                          <label className={cn("text-xs font-medium mb-1 block", isDark ? "text-slate-300" : "text-gray-600")}>Investment Amount (₹)</label>
                          <input
                            type="number"
                            value={projectionAmount}
                            onChange={(e) => setProjectionAmount(Number(e.target.value))}
                            className={cn(
                              "w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500",
                              isDark ? "bg-slate-800 border-slate-600 text-white" : "border-gray-200 bg-white"
                            )}
                            min={0}
                          />
                        </div>

                        {/* Time Period Selection */}
                        <div className="mb-4">
                          <label className={cn("text-xs font-medium mb-2 block", isDark ? "text-slate-300" : "text-gray-600")}>Investment Period</label>
                          <div className="flex gap-2">
                            {[1, 3, 5, 10].map((yr) => (
                              <button
                                key={yr}
                                onClick={() => setProjectionYears(yr)}
                                className={cn(
                                  'px-4 py-2 rounded-lg text-xs font-medium transition-all',
                                  projectionYears === yr
                                    ? 'bg-primary-600 text-white'
                                    : isDark 
                                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                                      : 'bg-white text-gray-600 hover:bg-gray-100'
                                )}
                              >
                                {yr} Year{yr > 1 ? 's' : ''}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Projected Returns */}
                        {projectionAmount > 0 && (
                          <div className="grid grid-cols-3 gap-3">
                            <div className={cn(
                              "rounded-lg p-3 text-center",
                              isDark ? "bg-slate-800" : "bg-white"
                            )}>
                              <p className={cn("text-xs mb-1", isDark ? "text-slate-400" : "text-gray-500")}>You Invest</p>
                              <p className={cn("font-bold text-sm", isDark ? "text-white" : "text-gray-900")}>{formatCurrency(projectionAmount)}</p>
                            </div>
                            <div className={cn(
                              "rounded-lg p-3 text-center",
                              isDark ? "bg-slate-800" : "bg-white"
                            )}>
                              <p className={cn("text-xs mb-1", isDark ? "text-slate-400" : "text-gray-500")}>Est. Returns</p>
                              <p className="font-bold text-emerald-600 text-sm">
                                +{formatCurrency(calculateProjectedReturn(projectionAmount, opt.expected_return_pct || 10, projectionYears).totalReturn)}
                              </p>
                            </div>
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-3 text-center text-white">
                              <p className="text-xs opacity-90 mb-1">Total Value</p>
                              <p className="font-bold text-sm">
                                {formatCurrency(calculateProjectedReturn(projectionAmount, opt.expected_return_pct || 10, projectionYears).futureValue)}
                              </p>
                            </div>
                          </div>
                        )}

                        <p className={cn("text-xs mt-3 flex items-center gap-1", isDark ? "text-slate-400" : "text-gray-500")}>
                          <Info className="w-3 h-3" />
                          Based on {opt.expected_return_pct || 10}% annual returns. Actual returns may vary.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl border mb-8",
          isDark ? "bg-slate-800 border-slate-700" : "bg-gray-50 border-gray-100"
        )}
      >
        <Info className={cn("w-5 h-5 flex-shrink-0 mt-0.5", isDark ? "text-slate-500" : "text-gray-400")} />
        <p className={cn("text-xs", isDark ? "text-slate-400" : "text-gray-500")}>
          These recommendations are for educational purposes only. Past performance doesn't guarantee future results.
          Please consult a financial advisor before making investment decisions.
        </p>
      </motion.div>
    </div>
  )
}

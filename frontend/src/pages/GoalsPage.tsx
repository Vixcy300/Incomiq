import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Target, Calendar, Trash2, Sparkles, TrendingUp, PiggyBank, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { formatCurrency, cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import { useAppStore } from '@/store/useAppStore'
import type { SavingsGoal } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { differenceInDays, format, addMonths } from 'date-fns'
import { goalsApi } from '@/lib/api'
import toast from 'react-hot-toast'

const goalSchema = z.object({
  name: z.string().min(1, 'Required').max(50),
  target_amount: z.coerce.number().min(100, 'Min ₹100'),
  target_date: z.string().min(1, 'Required'),
  icon: z.string().min(1),
  monthly_contribution: z.coerce.number().min(0).optional(),
})

type GoalForm = z.infer<typeof goalSchema>

const goalIcons = ['🏍️', '🚗', '📱', '💻', '🏠', '✈️', '💍', '📚', '🎮', '📷', '⌚', '🛡️', '🎨', '💼', '🏥', '🎉']

// Milestones for visual progress
const getMilestones = (target: number) => [
  { pct: 25, label: '25%', amount: target * 0.25 },
  { pct: 50, label: '50%', amount: target * 0.5 },
  { pct: 75, label: '75%', amount: target * 0.75 },
  { pct: 100, label: '100%', amount: target },
]

export default function GoalsPage() {
  const { t } = useTranslation()
  const { settings } = useAppStore()
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddMoneyModal, setShowAddMoneyModal] = useState<string | null>(null)
  const [addAmount, setAddAmount] = useState('')

  // Fetch goals from API on mount
  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      const data = await goalsApi.list()
      setGoals(data.goals || [])
    } catch (error) {
      console.error('Failed to load goals:', error)
      toast.error('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GoalForm>({
    // @ts-expect-error - Zod v4 coerce type inference issue with RHF
    resolver: zodResolver(goalSchema),
    defaultValues: {
      icon: '🎯',
      target_date: format(addMonths(new Date(), 6), 'yyyy-MM-dd'),
    },
  })

  const selectedIcon = watch('icon')

  // @ts-expect-error - Zod v4 coerce type inference issue
  const onCreateGoal = async (data: GoalForm) => {
    try {
      await goalsApi.create({
        name: data.name,
        target_amount: data.target_amount,
        target_date: data.target_date,
        icon: data.icon,
        monthly_contribution: data.monthly_contribution || 0,
      })
      toast.success('Goal created!')
      setShowCreateModal(false)
      reset()
      loadGoals()
    } catch (error) {
      toast.error('Failed to create goal')
      console.error(error)
    }
  }

  const handleAddMoney = async (goalId: string) => {
    const amount = Number(addAmount)
    if (amount > 0) {
      try {
        await goalsApi.addMoney(goalId, amount)
        toast.success(`Added ${formatCurrency(amount)}!`)
        loadGoals()
      } catch (error) {
        toast.error('Failed to add money')
        console.error(error)
      }
    }
    setShowAddMoneyModal(null)
    setAddAmount('')
  }

  const deleteGoal = async (id: string) => {
    try {
      await goalsApi.delete(id)
      toast.success('Goal deleted')
      loadGoals()
    } catch (error) {
      toast.error('Failed to delete goal')
      console.error(error)
    }
  }

  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0)
  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0)
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('goals_title')}</h1>
          <p className="text-gray-500 mt-1">{t('goals_subtitle')}</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
          {t('goals_new')}
        </Button>
      </motion.div>

      {/* Overall Progress Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden gradient-hero rounded-3xl p-6 md:p-8 text-white"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-white/70 text-sm font-medium mb-1">{t('goals_total_progress')}</p>
              <p className="text-4xl font-bold">
                {formatCurrency(totalSaved)}
                <span className="text-lg font-normal text-white/60 ml-2">/ {formatCurrency(totalTarget)}</span>
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-2">
                  <Target className="w-8 h-8" />
                </div>
                <p className="text-2xl font-bold">{goals.length}</p>
                <p className="text-xs text-white/60">Goals</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-2">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <p className="text-2xl font-bold">{overallProgress.toFixed(0)}%</p>
                <p className="text-xs text-white/60">{t('goals_complete')}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar with Milestones */}
          <div className="mt-6 relative">
            <div className="bg-white/20 rounded-full h-4 overflow-hidden">
              <motion.div
                className="bg-white h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(overallProgress, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            {/* Milestone markers */}
            <div className="flex justify-between mt-2 px-1">
              {[0, 25, 50, 75, 100].map((pct) => (
                <div key={pct} className="text-center">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full mx-auto mb-1',
                      overallProgress >= pct ? 'bg-white' : 'bg-white/30'
                    )}
                  />
                  <span className={cn('text-xs', overallProgress >= pct ? 'text-white' : 'text-white/50')}>{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Goal Cards */}
      {goals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center"
        >
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No goals yet. Create your first savings goal!</p>
          <Button onClick={() => setShowCreateModal(true)} icon={<Plus className="w-4 h-4" />}>
            {t('goals_new')}
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {goals.map((goal, i) => {
            const progress = (goal.current_amount / goal.target_amount) * 100
            const daysLeft = differenceInDays(new Date(goal.target_date), new Date())
            const monthsLeft = Math.ceil(daysLeft / 30)
            const remaining = goal.target_amount - goal.current_amount
            const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining
            const isOnTrack = goal.monthly_contribution >= monthlyNeeded
            const milestones = getMilestones(goal.target_amount)
            const currentMilestone = milestones.filter((m) => progress >= m.pct).length
            const incomePercentage = settings.monthlyIncome > 0 ? (goal.monthly_contribution / settings.monthlyIncome) * 100 : 0

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
                        <span className="text-3xl">{goal.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{goal.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span
                            className={cn(
                              'text-xs font-medium',
                              daysLeft > 30 ? 'text-gray-500' : daysLeft > 0 ? 'text-amber-600' : 'text-red-500'
                            )}
                          >
                            {daysLeft > 0 ? `${daysLeft} ${t('goals_days_left')}` : t('goals_overdue')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="p-5">
                  {/* Amount */}
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(goal.current_amount)}</p>
                      <p className="text-sm text-gray-400">of {formatCurrency(goal.target_amount)}</p>
                    </div>
                    <span
                      className={cn(
                        'text-sm font-bold px-3 py-1 rounded-full',
                        progress >= 100
                          ? 'bg-emerald-100 text-emerald-700'
                          : progress >= 50
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {progress.toFixed(0)}%
                    </span>
                  </div>

                  {/* Progress Bar with Milestone Dots */}
                  <div className="relative">
                    <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className={cn('h-full rounded-full', progress >= 75 ? 'bg-emerald-500' : 'gradient-hero')}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.08 }}
                      />
                    </div>
                    {/* Milestones */}
                    <div className="absolute top-0 left-0 right-0 h-3 flex items-center">
                      {milestones.slice(0, -1).map((m) => (
                        <div
                          key={m.pct}
                          style={{ left: `${m.pct}%` }}
                          className={cn(
                            'absolute w-3 h-3 rounded-full border-2 border-white transform -translate-x-1/2',
                            progress >= m.pct ? 'bg-emerald-500' : 'bg-gray-300'
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">{t('goals_monthly')}</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(goal.monthly_contribution)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">{t('goals_need_mo')}</p>
                      <p className={cn('text-lg font-bold', isOnTrack ? 'text-emerald-600' : 'text-amber-600')}>
                        {formatCurrency(monthlyNeeded)}
                      </p>
                    </div>
                  </div>

                  {/* AI Tip */}
                  {daysLeft > 0 && (
                    <div
                      className={cn(
                        'mt-4 rounded-xl p-3 flex items-start gap-2',
                        isOnTrack ? 'bg-emerald-50' : 'bg-amber-50'
                      )}
                    >
                      <Sparkles className={cn('w-4 h-4 mt-0.5', isOnTrack ? 'text-emerald-500' : 'text-amber-500')} />
                      <div>
                        <p className={cn('text-xs font-medium', isOnTrack ? 'text-emerald-700' : 'text-amber-700')}>
                          {t('goals_ai_tip')}
                        </p>
                        <p className={cn('text-xs mt-0.5', isOnTrack ? 'text-emerald-600' : 'text-amber-600')}>
                          {isOnTrack
                            ? t('goals_on_track')
                            : `${t('goals_increase')} ${formatCurrency(monthlyNeeded - goal.monthly_contribution)} ${t('goals_to_track')}`}
                        </p>
                        {incomePercentage > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {incomePercentage.toFixed(1)}% {t('goals_percentage')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Add Money Button */}
                  <button
                    onClick={() => setShowAddMoneyModal(goal.id)}
                    className="w-full mt-4 py-3 px-4 bg-primary-50 hover:bg-primary-100 text-primary-700 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <PiggyBank className="w-4 h-4" />
                    {t('goals_add_money')}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={t('goals_create')}>
        {/* @ts-expect-error */}
        <form onSubmit={handleSubmit(onCreateGoal)} className="space-y-5">
          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('goals_choose_icon')}</label>
            <div className="grid grid-cols-8 gap-2">
              {goalIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setValue('icon', icon)}
                  className={cn(
                    'p-2 text-2xl rounded-xl border-2 transition-all text-center',
                    selectedIcon === icon
                      ? 'border-primary-500 bg-primary-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
            <input type="hidden" {...register('icon')} />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('goals_name')}</label>
            <input
              {...register('name')}
              placeholder="e.g., New Bike"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Target Amount + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('goals_target_amount')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  {...register('target_amount')}
                  placeholder="50,000"
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
              {errors.target_amount && <p className="text-xs text-red-500 mt-1">{errors.target_amount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('goals_target_date')}</label>
              <input
                type="date"
                {...register('target_date')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>

          {/* Monthly Contribution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('goals_monthly_contrib')} (optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="number"
                {...register('monthly_contribution')}
                placeholder="2,500"
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>

      {/* Add Money Modal */}
      <Modal
        isOpen={!!showAddMoneyModal}
        onClose={() => {
          setShowAddMoneyModal(null)
          setAddAmount('')
        }}
        title={t('goals_add_money')}
        size="sm"
      >
        <div className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-lg">₹</span>
            <input
              type="number"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-xl text-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[500, 1000, 2000, 5000].map((amt) => (
              <button
                key={amt}
                onClick={() => setAddAmount(String(amt))}
                className={cn(
                  'py-3 text-sm font-medium border-2 rounded-xl transition-all',
                  addAmount === String(amt)
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                ₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddMoneyModal(null)
                setAddAmount('')
              }}
            >
              {t('cancel')}
            </Button>
            <Button onClick={() => showAddMoneyModal && handleAddMoney(showAddMoneyModal)}>{t('goals_add_money')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

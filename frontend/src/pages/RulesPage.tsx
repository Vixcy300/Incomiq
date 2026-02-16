import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Zap,
  Shield,
  Power,
  Trash2,
  Sparkles,
  TrendingUp,
  PiggyBank,
  ArrowRight,
  Info,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { formatCurrency, cn } from '@/lib/utils'
import { rulesApi } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'
import type { SavingsRule } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

const ruleFormSchema = z.object({
  name: z.string().min(1, 'Required').max(50),
  condition_field: z.enum(['amount', 'category', 'source', 'monthly_total']),
  condition_operator: z.enum(['gt', 'lt', 'eq', 'is']),
  condition_value: z.string().min(1, 'Required'),
  action_type: z.enum(['save_percentage', 'save_fixed']),
  action_value: z.coerce.number().min(1),
  action_destination: z.string().min(1, 'Required'),
  safety_min_balance: z.coerce.number().optional(),
  safety_min_income: z.coerce.number().optional(),
})

type RuleFormData = z.infer<typeof ruleFormSchema>

// Pre-built templates with visual design
const templates = [
  {
    name: 'Conservative Saver',
    icon: '🛡️',
    color: 'emerald',
    description: 'Save 10% when payment > ₹1,500',
    conditions: [{ field: 'amount' as const, operator: 'gt' as const, value: 1500 }],
    action: { type: 'save_percentage' as const, value: 10, destination: 'Emergency Fund' },
    safety: { min_monthly_income: 8000 },
  },
  {
    name: 'Aggressive Growth',
    icon: '🚀',
    color: 'rose',
    description: 'Save 20% when payment > ₹2,000',
    conditions: [{ field: 'amount' as const, operator: 'gt' as const, value: 2000 }],
    action: { type: 'save_percentage' as const, value: 20, destination: 'Emergency Fund' },
    safety: { min_monthly_income: 12000 },
  },
  {
    name: 'Emergency First',
    icon: '🏥',
    color: 'blue',
    description: 'Always build your safety net',
    conditions: [{ field: 'amount' as const, operator: 'gt' as const, value: 1000 }],
    action: { type: 'save_percentage' as const, value: 15, destination: 'Emergency Fund' },
    safety: { min_balance: 2000 },
  },
  {
    name: 'Freelance Booster',
    icon: '💼',
    color: 'amber',
    description: 'Save 25% of freelance income',
    conditions: [{ field: 'category' as const, operator: 'is' as const, value: 'freelance' }],
    action: { type: 'save_percentage' as const, value: 25, destination: 'Goals' },
    safety: { min_balance: 3000 },
  },
]

const templateColorClasses: Record<string, { bg: string; border: string; text: string }> = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
}

export default function RulesPage() {
  const { t } = useTranslation()
  const [rules, setRules] = useState<SavingsRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Fetch rules from API
  const fetchRules = useCallback(async () => {
    try {
      const res = await rulesApi.list()
      setRules(res.rules || [])
    } catch (err) {
      console.error('Failed to fetch rules:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const toggleRule = async (id: string) => {
    try {
      await rulesApi.toggle(id)
      setRules(rules.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r)))
    } catch (err) {
      console.error('Failed to toggle rule:', err)
    }
  }

  const deleteRule = async (id: string) => {
    try {
      await rulesApi.delete(id)
      setRules(rules.filter((r) => r.id !== id))
    } catch (err) {
      console.error('Failed to delete rule:', err)
    }
  }

  const addRuleFromTemplate = async (template: (typeof templates)[0]) => {
    // Backend expects "condition" (singular) not "conditions" (array)
    const newRule = {
      name: template.name,
      condition: template.conditions[0], // Take first condition
      action: template.action,
      safety: {
        min_balance: template.safety?.min_balance || 0,
        min_income: template.safety?.min_monthly_income || 0,
      },
    }
    try {
      const created = await rulesApi.create(newRule)
      setRules([...rules, created])
      toast.success(`"${template.name}" rule activated!`)
    } catch (err) {
      console.error('Failed to create rule from template:', err)
      toast.error('Failed to create rule')
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RuleFormData>({
    // @ts-expect-error - Zod v4 coerce type inference issue with RHF
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      condition_field: 'amount',
      condition_operator: 'gt',
      action_type: 'save_percentage',
      action_destination: 'Emergency Fund',
    },
  })

  const onCreateRule = async (data: RuleFormData) => {
    // Backend expects "condition" (singular) not "conditions" (array)
    const newRule = {
      name: data.name,
      condition: {
        field: data.condition_field,
        operator: data.condition_operator,
        value:
          data.condition_field === 'amount' || data.condition_field === 'monthly_total'
            ? Number(data.condition_value)
            : data.condition_value,
      },
      action: { 
        type: data.action_type, 
        value: data.action_value, 
        destination: data.action_destination 
      },
      safety: {
        min_balance: data.safety_min_balance || 0,
        min_income: data.safety_min_income || 0,
      },
    }
    try {
      const created = await rulesApi.create(newRule)
      setRules([...rules, created])
      setShowCreateModal(false)
      reset()
      toast.success('Rule created successfully!')
    } catch (err) {
      console.error('Failed to create rule:', err)
      toast.error('Failed to create rule')
    }
  }

  const totalSaved = rules.reduce((s, r) => s + (r.total_saved || 0), 0)
  const activeCount = rules.filter((r) => r.is_active).length
  const totalTriggered = rules.reduce((s, r) => s + (r.times_triggered || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('rules_title')}</h1>
          <p className="text-gray-500 mt-1">{t('rules_subtitle')}</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
          {t('rules_create')}
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-primary-500" />
          </div>
          <p className="text-sm text-gray-500">{t('rules_active')}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <PiggyBank className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-sm text-gray-500">{t('rules_total_saved')}</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{formatCurrency(totalSaved)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm text-gray-500">{t('rules_triggered')}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalTriggered}x</p>
        </div>
      </motion.div>

      {/* Templates */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          {t('rules_templates')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {templates.map((tpl, i) => {
            const colors = templateColorClasses[tpl.color]
            return (
              <motion.button
                key={tpl.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                onClick={() => addRuleFromTemplate(tpl)}
                className={cn(
                  'text-left p-5 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group',
                  colors.bg,
                  colors.border
                )}
              >
                <span className="text-3xl block">{tpl.icon}</span>
                <h4 className="font-semibold text-gray-900 mt-3">{tpl.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{tpl.description}</p>
                <span className={cn('text-xs font-medium mt-3 flex items-center gap-1', colors.text)}>
                  {t('rules_add_template')}
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Your Rules */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-500" />
          {t('rules_your_rules')}
        </h3>

        {rules.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">No rules yet. Add a template or create your own!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule, i) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className={cn(
                  'bg-white rounded-2xl border-2 p-5 transition-all duration-200',
                  rule.is_active ? 'border-gray-200' : 'border-gray-100 opacity-50'
                )}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Rule Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-semibold text-gray-900 truncate">{rule.name}</h4>
                      <Badge variant={rule.is_active ? 'success' : 'default'}>
                        {rule.is_active ? 'Active' : t('rules_paused')}
                      </Badge>
                    </div>

                    {/* Visual Rule Flow */}
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">
                        {t('rules_if')}
                      </span>
                      <span className="text-gray-600">
                        {rule.conditions.map((c) => {
                          const op = c.operator === 'gt' ? '>' : c.operator === 'lt' ? '<' : c.operator === 'is' ? 'is' : '='
                          const val = typeof c.value === 'number' ? formatCurrency(c.value) : c.value
                          return `${c.field} ${op} ${val}`
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                        {t('rules_then')}
                      </span>
                      <span className="text-gray-600">
                        Save {rule.action.type === 'save_percentage' ? `${rule.action.value}%` : formatCurrency(rule.action.value)} →{' '}
                        {rule.action.destination}
                      </span>
                      {(rule.safety.min_balance || rule.safety.min_monthly_income) && (
                        <>
                          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
                            {t('rules_unless')}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {rule.safety.min_balance && `balance < ${formatCurrency(rule.safety.min_balance)}`}
                            {rule.safety.min_balance && rule.safety.min_monthly_income && ' or '}
                            {rule.safety.min_monthly_income && `income < ${formatCurrency(rule.safety.min_monthly_income)}`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stats + Actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-center px-4">
                      <p className="text-xs text-gray-400">Saved</p>
                      <p className="font-bold text-emerald-600">{formatCurrency(rule.total_saved)}</p>
                    </div>
                    <div className="text-center px-4 border-l border-gray-100">
                      <p className="text-xs text-gray-400">Triggered</p>
                      <p className="font-bold text-gray-700">{rule.times_triggered}x</p>
                    </div>
                    <div className="flex items-center gap-1 border-l border-gray-100 pl-4">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={cn(
                          'p-2 rounded-xl transition-colors',
                          rule.is_active
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        )}
                        title={rule.is_active ? 'Pause' : 'Activate'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl border border-primary-100 p-6"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">{t('rules_how_works')}</h4>
            <p className="text-sm text-gray-600">
              Rules automatically save money when conditions are met. For example: "IF payment {'>'} ₹1,500, THEN save 10% to
              Emergency Fund, UNLESS balance is below ₹2,000." Your savings grow automatically!
            </p>
          </div>
        </div>
      </motion.div>

      {/* Create Rule Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={t('rules_create')} size="lg">
        {/* @ts-expect-error - Async handler type mismatch */}
        <form onSubmit={handleSubmit(onCreateRule)} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('rules_name')}</label>
            <input
              {...register('name')}
              placeholder="e.g., Freelance Power Saver"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* IF Condition */}
          <div className="bg-primary-50 rounded-2xl p-5 border border-primary-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">{t('rules_if')}</span>
              <span className="text-sm font-medium text-gray-700">{t('rules_condition')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                {...register('condition_field')}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="amount">Payment amount</option>
                <option value="category">Category</option>
                <option value="source">Source</option>
                <option value="monthly_total">Monthly total</option>
              </select>
              <select
                {...register('condition_operator')}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="gt">is greater than</option>
                <option value="lt">is less than</option>
                <option value="eq">equals</option>
                <option value="is">is</option>
              </select>
              <input
                {...register('condition_value')}
                placeholder="₹1,500 or freelance"
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>

          {/* THEN Action */}
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">{t('rules_then')}</span>
              <span className="text-sm font-medium text-gray-700">{t('rules_action')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                {...register('action_type')}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="save_percentage">Save %</option>
                <option value="save_fixed">Save fixed ₹</option>
              </select>
              <input
                type="number"
                {...register('action_value')}
                placeholder="15"
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <select
                {...register('action_destination')}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="Emergency Fund">🛡️ Emergency Fund</option>
                <option value="Goals">🎯 Goals</option>
                <option value="Vacation">✈️ Vacation</option>
                <option value="Education">📚 Education</option>
                <option value="Investment">📈 Investment</option>
                <option value="Retirement">🏦 Retirement</option>
              </select>
            </div>
          </div>

          {/* UNLESS Safety */}
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">{t('rules_unless')}</span>
              <span className="text-sm font-medium text-gray-700">{t('rules_safety')} (optional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Min balance required</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    {...register('safety_min_balance')}
                    placeholder="2,000"
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Min monthly income</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    {...register('safety_min_income')}
                    placeholder="8,000"
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              </div>
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
    </div>
  )
}

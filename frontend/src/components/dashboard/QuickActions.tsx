import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Target, TrendingUp, PiggyBank, Receipt, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const actions = [
  {
    icon: Plus,
    label: 'Add Expense',
    to: '/expenses',
    color: 'text-red-600',
    bg: 'bg-red-50 hover:bg-red-100',
    border: 'border-red-200',
  },
  {
    icon: Target,
    label: 'New Goal',
    to: '/goals',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    border: 'border-emerald-200',
  },
  {
    icon: TrendingUp,
    label: 'Invest',
    to: '/investments',
    color: 'text-blue-600',
    bg: 'bg-blue-50 hover:bg-blue-100',
    border: 'border-blue-200',
  },
  {
    icon: PiggyBank,
    label: 'Add Rule',
    to: '/rules',
    color: 'text-purple-600',
    bg: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-200',
  },
]

export default function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action, idx) => {
        const Icon = action.icon
        return (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link
              to={action.to}
              className={cn(
                'flex flex-col items-center justify-center p-4 rounded-2xl border transition-all group',
                action.bg,
                action.border
              )}
            >
              <Icon className={cn('w-6 h-6 mb-2', action.color)} />
              <span className="text-xs font-medium text-gray-700">{action.label}</span>
              <ArrowRight className="w-3 h-3 text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}

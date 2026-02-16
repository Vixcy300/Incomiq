import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: ReactNode
  subtitle?: string
  delay?: number
}

export default function MetricCard({ title, value, change, changeType = 'neutral', icon, subtitle, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-card hover:shadow-elevated transition-shadow duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
          {change && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  'text-sm font-medium',
                  changeType === 'positive' && 'text-success-500',
                  changeType === 'negative' && 'text-danger-500',
                  changeType === 'neutral' && 'text-gray-500'
                )}
              >
                {change}
              </span>
              {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
          {icon}
        </div>
      </div>
    </motion.div>
  )
}

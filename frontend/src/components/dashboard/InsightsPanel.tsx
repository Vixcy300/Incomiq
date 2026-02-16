import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import type { AIInsight } from '@/types'

interface InsightsPanelProps {
  insights: AIInsight[]
}

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary-500" />
        <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">
          Powered by AI
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.15 }}
            className={cn(
              'rounded-xl p-4 border',
              insight.type === 'achievement' && 'bg-success-50 border-success-500/20',
              insight.type === 'warning' && 'bg-warning-50 border-warning-500/20',
              insight.type === 'tip' && 'bg-primary-50 border-primary-500/20'
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{insight.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      insight.type === 'achievement' && 'bg-success-500/10 text-success-600',
                      insight.type === 'warning' && 'bg-warning-500/10 text-warning-600',
                      insight.type === 'tip' && 'bg-primary-500/10 text-primary-600'
                    )}
                  >
                    {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">{insight.title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{insight.message}</p>
                {insight.action && (
                  <p className="text-xs text-primary-600 font-medium mt-2 cursor-pointer hover:underline">
                    → {insight.action}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

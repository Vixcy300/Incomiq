import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface HealthScoreGaugeProps {
  score: number // 0-100
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function HealthScoreGauge({ score, label = 'Health Score', size = 'md' }: HealthScoreGaugeProps) {
  const normalizedScore = Math.min(100, Math.max(0, score))
  
  // Calculate color based on score
  const getColor = (s: number) => {
    if (s >= 80) return { stroke: '#10B981', bg: '#D1FAE5', text: 'text-emerald-600' }
    if (s >= 60) return { stroke: '#3B82F6', bg: '#DBEAFE', text: 'text-blue-600' }
    if (s >= 40) return { stroke: '#F59E0B', bg: '#FEF3C7', text: 'text-amber-600' }
    return { stroke: '#EF4444', bg: '#FEE2E2', text: 'text-red-600' }
  }
  
  const colors = getColor(normalizedScore)
  
  // Get status text
  const getStatus = (s: number) => {
    if (s >= 80) return 'Excellent'
    if (s >= 60) return 'Good'
    if (s >= 40) return 'Needs Attention'
    return 'At Risk'
  }
  
  const sizes = {
    sm: { width: 80, strokeWidth: 6, fontSize: 'text-lg' },
    md: { width: 120, strokeWidth: 8, fontSize: 'text-2xl' },
    lg: { width: 160, strokeWidth: 10, fontSize: 'text-3xl' },
  }
  
  const config = sizes[size]
  const radius = (config.width - config.strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${config.width} ${config.width}`}>
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={config.strokeWidth}
          />
          {/* Progress arc */}
          <motion.circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={cn('font-bold', config.fontSize, colors.text)}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {normalizedScore}
          </motion.span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</span>
        </div>
      </div>
      
      <motion.span
        className={cn('mt-2 text-sm font-medium', colors.text)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {getStatus(normalizedScore)}
      </motion.span>
    </div>
  )
}

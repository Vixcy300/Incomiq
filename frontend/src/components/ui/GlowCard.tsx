import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlowCardProps {
  children: ReactNode
  className?: string
  variant?: 'orange' | 'blue' | 'green' | 'purple' | 'pink' | 'default'
  hoverable?: boolean
  onClick?: () => void
}

const gradients = {
  orange: 'from-amber-400 via-orange-500 to-rose-500',
  blue: 'from-cyan-400 via-blue-500 to-purple-500',
  green: 'from-emerald-400 via-teal-500 to-cyan-500',
  purple: 'from-violet-400 via-purple-500 to-fuchsia-500',
  pink: 'from-pink-400 via-rose-500 to-red-500',
  default: 'from-gray-400 via-gray-500 to-gray-600',
}

export default function GlowCard({
  children,
  className,
  variant = 'blue',
  hoverable = true,
  onClick,
}: GlowCardProps) {
  return (
    <motion.div
      className={cn('glow-card-wrapper group relative', className)}
      whileHover={hoverable ? { scale: 1.02, y: -5 } : undefined}
      whileTap={hoverable ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
    >
      {/* Animated gradient background (skewed) */}
      <div
        className={cn(
          'absolute top-0 left-[50px] w-1/2 h-full rounded-xl bg-gradient-to-br opacity-80',
          'transform skew-x-[15deg] transition-all duration-500 ease-out',
          'group-hover:skew-x-0 group-hover:left-5 group-hover:w-[calc(100%-40px)]',
          gradients[variant]
        )}
      />

      {/* Blur glow effect */}
      <div
        className={cn(
          'absolute top-0 left-[50px] w-1/2 h-full rounded-xl bg-gradient-to-br',
          'transform skew-x-[15deg] blur-[30px] opacity-60 transition-all duration-500 ease-out',
          'group-hover:skew-x-0 group-hover:left-5 group-hover:w-[calc(100%-40px)]',
          gradients[variant]
        )}
      />

      {/* Floating orbs on hover */}
      <span className="absolute inset-0 z-10 pointer-events-none">
        {/* Top-left orb */}
        <motion.div
          className="absolute top-0 left-0 w-0 h-0 rounded-xl bg-white/10 backdrop-blur-sm shadow-lg opacity-0"
          initial={false}
          animate={{
            y: [10, -10, 10],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
          }}
          whileHover={{
            top: -50,
            left: 50,
            width: 100,
            height: 100,
            opacity: 1,
          }}
        />
        {/* Bottom-right orb */}
        <motion.div
          className="absolute bottom-0 right-0 w-0 h-0 rounded-xl bg-white/10 backdrop-blur-sm shadow-lg opacity-0"
          initial={false}
          animate={{
            y: [-10, 10, -10],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          style={{
            boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
          }}
        />
      </span>

      {/* Glass content container */}
      <div
        className={cn(
          'relative z-20 p-5 rounded-xl transition-all duration-500',
          'bg-white/5 backdrop-blur-md shadow-xl',
          'border border-white/10',
          'group-hover:-translate-x-2 group-hover:py-8'
        )}
      >
        {children}
      </div>
    </motion.div>
  )
}

// Smaller variant for metric cards
export function GlowMetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  variant = 'blue',
  className,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  subValue?: string
  trend?: { value: number; positive: boolean }
  variant?: 'orange' | 'blue' | 'green' | 'purple' | 'pink' | 'default'
  className?: string
}) {
  return (
    <GlowCard variant={variant} className={className}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-white/60 font-medium">{label}</p>
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
          {subValue && <p className="text-xs text-white/50">{subValue}</p>}
          {trend && (
            <div
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                trend.positive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              )}
            >
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            'bg-white/10 backdrop-blur-sm'
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </GlowCard>
  )
}

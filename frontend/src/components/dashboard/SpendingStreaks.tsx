import { motion } from 'framer-motion'
import { Flame, Trophy, TrendingDown, Calendar, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreakData {
  currentStreak: number
  bestStreak: number
  type: 'under_budget' | 'no_dirty' | 'daily_track' | 'savings'
}

const streakConfig = {
  under_budget: {
    icon: TrendingDown,
    title: 'Under Budget',
    description: 'Days staying under daily limit',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  no_dirty: {
    icon: Flame,
    title: 'Clean Spending',
    description: 'Days without dirty expenses',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  daily_track: {
    icon: Calendar,
    title: 'Daily Tracker',
    description: 'Consecutive days logging expenses',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  savings: {
    icon: Zap,
    title: 'Savings Streak',
    description: 'Days adding to savings',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
}

export default function SpendingStreaks({ streaks }: { streaks: StreakData[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-md">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Spending Streaks</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {streaks.map((streak, idx) => {
          const config = streakConfig[streak.type]
          const Icon = config.icon
          
          return (
            <motion.div
              key={streak.type}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.02 }}
              className={cn(
                'rounded-xl p-4 border transition-all duration-200 cursor-default',
                config.bg,
                config.border,
                'dark:bg-opacity-20 dark:border-opacity-30'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('w-4 h-4', config.color)} />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{config.title}</span>
              </div>
              
              <div className="flex items-end justify-between">
                <div>
                  <span className={cn('text-3xl font-bold', config.color)}>
                    {streak.currentStreak}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">days</span>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                  <Trophy className="w-3 h-3" />
                  <span>Best: {streak.bestStreak}</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {/* Motivational message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-amber-900/20 rounded-xl p-3 text-center border border-amber-200 dark:border-amber-700/30"
      >
        <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
          🔥 Keep your streaks going to build better financial habits!
        </span>
      </motion.div>
    </div>
  )
}

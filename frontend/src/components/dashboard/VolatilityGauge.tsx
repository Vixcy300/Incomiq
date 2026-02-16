import { cn } from '@/lib/utils'
import type { VolatilityData } from '@/types'

interface VolatilityGaugeProps {
  data: VolatilityData
}

export default function VolatilityGauge({ data }: VolatilityGaugeProps) {
  const angle = Math.min((data.score / 100) * 180, 180)

  return (
    <div className="flex flex-col items-center">
      {/* SVG Gauge */}
      <div className="relative w-48 h-28">
        <svg viewBox="0 0 200 110" className="w-full h-full">
          {/* Background arc */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#E5E7EB" strokeWidth="12" strokeLinecap="round" />
          {/* Green zone */}
          <path d="M 20 100 A 80 80 0 0 1 66 32" fill="none" stroke="#10B981" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
          {/* Amber zone */}
          <path d="M 66 32 A 80 80 0 0 1 134 32" fill="none" stroke="#F59E0B" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
          {/* Red zone */}
          <path d="M 134 32 A 80 80 0 0 1 180 100" fill="none" stroke="#EF4444" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
          {/* Needle */}
          <line
            x1="100"
            y1="100"
            x2={100 + 60 * Math.cos(Math.PI - (angle * Math.PI) / 180)}
            y2={100 - 60 * Math.sin(Math.PI - (angle * Math.PI) / 180)}
            stroke={data.color}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="6" fill={data.color} />
          <circle cx="100" cy="100" r="3" fill="white" />
        </svg>
      </div>

      {/* Score */}
      <div className="text-center mt-2">
        <span className="text-3xl font-bold" style={{ color: data.color }}>
          {data.score}
        </span>
        <span className="text-sm text-gray-500 ml-1">/ 100</span>
      </div>

      {/* Rating */}
      <span
        className={cn(
          'mt-2 text-sm font-medium px-3 py-1 rounded-full',
          data.rating === 'low' && 'bg-success-50 text-success-600',
          data.rating === 'medium' && 'bg-warning-50 text-warning-600',
          data.rating === 'high' && 'bg-danger-50 text-danger-600'
        )}
      >
        {data.rating.charAt(0).toUpperCase() + data.rating.slice(1)} Volatility
      </span>

      {/* Message */}
      <p className="text-xs text-gray-500 text-center mt-3 leading-relaxed px-2">
        {data.message}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-6 mt-4 text-center">
        <div>
          <p className="text-xs text-gray-500">Avg Income</p>
          <p className="text-sm font-semibold text-gray-900">
            ₹{data.mean_income.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div>
          <p className="text-xs text-gray-500">Std Dev</p>
          <p className="text-sm font-semibold text-gray-900">
            ±₹{data.std_deviation.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  )
}

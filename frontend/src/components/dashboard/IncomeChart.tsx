import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface ChartData {
  month: string
  freelance: number
  delivery: number
  content: number
  tutoring: number
  ecommerce: number
  total: number
}

interface IncomeChartProps {
  data: ChartData[]
}

const categories = [
  { key: 'freelance', color: '#2563EB', name: 'Freelance' },
  { key: 'delivery', color: '#F59E0B', name: 'Delivery' },
  { key: 'content', color: '#EF4444', name: 'Content' },
  { key: 'tutoring', color: '#06B6D4', name: 'Tutoring' },
  { key: 'ecommerce', color: '#10B981', name: 'E-Commerce' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-elevated p-4 min-w-[180px]">
      <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm py-0.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600">{entry.name}</span>
          </div>
          <span className="font-medium text-gray-900">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function IncomeChart({ data }: IncomeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <defs>
          {categories.map((cat) => (
            <linearGradient key={cat.key} id={`gradient-${cat.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={cat.color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={cat.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: '#9CA3AF' }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          height={36}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '12px' }}
        />
        {categories.map((cat) => (
          <Area
            key={cat.key}
            type="monotone"
            dataKey={cat.key}
            name={cat.name}
            stroke={cat.color}
            strokeWidth={2}
            fill={`url(#gradient-${cat.key})`}
            animationDuration={800}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

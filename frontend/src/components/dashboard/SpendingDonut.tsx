import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface SpendingItem {
  category: string
  amount: number
  percentage: number
  color: string
}

interface SpendingDonutProps {
  data: SpendingItem[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-elevated p-3">
      <p className="text-sm font-medium text-gray-900">{d.category}</p>
      <p className="text-sm text-gray-600">{formatCurrency(d.amount)} ({d.percentage.toFixed(1)}%)</p>
    </div>
  )
}

export default function SpendingDonut({ data }: SpendingDonutProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <ResponsiveContainer width={220} height={220}>
          <PieChart>
            <Pie
              data={data.filter(d => d.amount > 0)}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={100}
              paddingAngle={3}
              dataKey="amount"
              animationDuration={800}
              animationBegin={300}
            >
              {data.filter(d => d.amount > 0).map((entry, index) => (
                <Cell key={index} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-gray-500">Total</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="mt-4 w-full space-y-2">
        {data.filter(d => d.amount > 0).map((item) => (
          <div key={item.category} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-gray-600">{item.category}</span>
            </div>
            <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

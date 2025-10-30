import { useMemo } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ChartData {
  date: string
  revenue?: number
  orders?: number
  new_users?: number
  total_users?: number
}

interface ChartProps {
  data: ChartData[]
  type: 'revenue' | 'users'
  height?: number
  period?: string
}

export function Chart({ data, type, height = 300, period = '7d' }: ChartProps) {
  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      displayDate: formatChartDate(item.date, period)
    }))
  }, [data, period])

  if (type === 'revenue') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="displayDate" 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `¥${value}`}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="text-sm text-gray-600 mb-1">{label}</p>
                    <p className="text-sm font-medium text-blue-600">
                      收入: {formatCurrency(payload[0].value as number)}
                    </p>
                    {payload[1] && (
                      <p className="text-sm font-medium text-green-600">
                        订单: {payload[1].value}
                      </p>
                    )}
                  </div>
                )
              }
              return null
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'users') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="displayDate" 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="text-sm text-gray-600 mb-1">{label}</p>
                    <p className="text-sm font-medium text-blue-600">
                      新用户: {payload[0].value}
                    </p>
                    {payload[1] && (
                      <p className="text-sm font-medium text-green-600">
                        总用户: {payload[1].value}
                      </p>
                    )}
                  </div>
                )
              }
              return null
            }}
          />
          <Line
            type="monotone"
            dataKey="new_users"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="total_users"
            stroke="#3B82F6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return null
}

function formatChartDate(dateString: string, period: string): string {
  const date = new Date(dateString)
  
  if (period === '1y') {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' })
  } else if (period === '90d') {
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
  }
}
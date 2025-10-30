import { useState } from 'react'
import { cn } from '@/lib/utils'

interface PeriodSelectorProps {
  value: string
  onChange: (period: string) => void
  className?: string
}

const periods = [
  { value: '7d', label: '7天' },
  { value: '30d', label: '30天' },
  { value: '90d', label: '90天' },
  { value: '1y', label: '1年' },
]

export function PeriodSelector({ value, onChange, className }: PeriodSelectorProps) {
  return (
    <div className={cn('flex space-x-1 bg-gray-100 rounded-lg p-1', className)}>
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            value === period.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  )
}
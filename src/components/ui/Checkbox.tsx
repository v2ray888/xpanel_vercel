import React from 'react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked)
      }
      if (props.onChange) {
        props.onChange(e)
      }
    }

    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          className={cn(
            'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
            className
          )}
          ref={ref}
          onChange={handleChange}
          {...props}
        />
        {label && (
          <label
            htmlFor={props.id}
            className="ml-2 block text-sm text-gray-700"
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
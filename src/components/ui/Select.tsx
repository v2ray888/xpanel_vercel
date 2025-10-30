import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectProps {
  value?: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  disabled?: boolean
}

interface SelectTriggerProps {
  children: React.ReactNode
  className?: string
}

interface SelectContentProps {
  children: React.ReactNode
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
}

const SelectContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}>({
  value: '',
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
})

const Select = ({ value = '', onValueChange, children, disabled }: SelectProps) => {
  const [open, setOpen] = useState(false)
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = ({ children, className }: SelectTriggerProps) => {
  const { open, setOpen } = React.useContext(SelectContext)
  
  return (
    <button
      type="button"
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      onClick={() => setOpen(!open)}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { value } = React.useContext(SelectContext)
  
  return <span>{value || placeholder}</span>
}

const SelectContent = ({ children }: SelectContentProps) => {
  const { open, setOpen } = React.useContext(SelectContext)
  const contentRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, setOpen])
  
  if (!open) return null
  
  return (
    <div
      ref={contentRef}
      className="absolute top-full z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
    >
      <div className="p-1">{children}</div>
    </div>
  )
}

const SelectItem = ({ value, children }: SelectItemProps) => {
  const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext)
  
  const isSelected = selectedValue === value
  
  return (
    <div
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground',
        isSelected && 'bg-accent text-accent-foreground'
      )}
      onClick={() => {
        onValueChange(value)
        setOpen(false)
      }}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      <span>{children}</span>
    </div>
  )
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
}
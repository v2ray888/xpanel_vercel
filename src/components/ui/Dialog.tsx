import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface DialogTriggerProps {
  asChild?: boolean
  children: React.ReactNode
  onClick?: () => void
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

interface DialogHeaderProps {
  children: React.ReactNode
  className?: string
}

interface DialogTitleProps {
  children: React.ReactNode
  className?: string
}

const DialogContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>({
  open: false,
  onOpenChange: () => {},
})

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => onOpenChange(false)}
          />
          {children}
        </div>
      )}
    </DialogContext.Provider>
  )
}

const DialogTrigger = ({ asChild, children, onClick }: DialogTriggerProps) => {
  const { onOpenChange } = React.useContext(DialogContext)
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: () => {
        onOpenChange(true)
        if (onClick) onClick()
      }
    })
  }
  
  return (
    <button 
      onClick={() => {
        onOpenChange(true)
        if (onClick) onClick()
      }}
    >
      {children}
    </button>
  )
}

const DialogContent = ({ children, className }: DialogContentProps) => {
  const { onOpenChange } = React.useContext(DialogContext)
  
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [onOpenChange])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div 
        className={cn(
          'relative bg-white rounded-xl shadow-xl w-full max-h-[90vh] overflow-y-auto max-w-md',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full p-1"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  )
}

const DialogHeader = ({ children, className }: DialogHeaderProps) => {
  return (
    <div className={cn('flex items-center justify-between p-4 border-b', className)}>
      {children}
    </div>
  )
}

const DialogTitle = ({ children, className }: DialogTitleProps) => {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900', className)}>
      {children}
    </h3>
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle
}
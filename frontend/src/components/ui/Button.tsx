import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        // Variants
        variant === 'primary' && 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm',
        variant === 'secondary' && 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
        variant === 'outline' && 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
        variant === 'ghost' && 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
        variant === 'danger' && 'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500',
        // Sizes
        size === 'sm' && 'text-sm px-3 py-1.5 gap-1.5',
        size === 'md' && 'text-sm px-4 py-2.5 gap-2',
        size === 'lg' && 'text-base px-6 py-3 gap-2.5',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}

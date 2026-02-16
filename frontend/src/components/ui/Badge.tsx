import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
}

export default function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'md' && 'text-sm px-3 py-1',
        variant === 'default' && 'bg-gray-100 text-gray-700',
        variant === 'success' && 'bg-success-50 text-success-600',
        variant === 'warning' && 'bg-warning-50 text-warning-600',
        variant === 'danger' && 'bg-danger-50 text-danger-600',
        variant === 'info' && 'bg-primary-50 text-primary-600'
      )}
    >
      {children}
    </span>
  )
}

import { HTMLAttributes } from 'react'

type CardVariant = 'default' | 'featured' | 'glass'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
}

const variantClasses: Record<CardVariant, string> = {
  default:  'bg-surface shadow-card border border-border',
  featured: 'bg-accent text-white shadow-card',
  glass:    'glass border border-white/40 shadow-card',
}

export function Card({ variant = 'default', className = '', children, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`rounded-2xl p-6 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </div>
  )
}

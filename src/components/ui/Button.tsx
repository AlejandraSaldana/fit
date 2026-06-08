import { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:     'bg-accent text-white shadow-card active:bg-accent-dark disabled:opacity-40',
  ghost:       'bg-transparent text-ink border border-border active:bg-border/50 disabled:opacity-40',
  destructive: 'bg-danger text-white shadow-card active:opacity-80 disabled:opacity-40',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9  px-4 text-xs  rounded-xl',
  md: 'h-12 px-6 text-sm  rounded-xl',
  lg: 'h-14 px-8 text-body rounded-2xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        'inline-flex items-center justify-center font-sans font-semibold',
        'transition-opacity duration-150 cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}

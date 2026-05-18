import { Loader2 } from 'lucide-react'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...rest
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-btn transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none'
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  }
  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-light',
    secondary: 'bg-white text-ink border-hairline border-line hover:bg-canvas',
    outline: 'bg-transparent text-ink border-hairline border-line hover:bg-white',
    ghost: 'bg-transparent text-ink hover:bg-canvas',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    accent: 'bg-accent text-white hover:bg-accent-dark'
  }
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}

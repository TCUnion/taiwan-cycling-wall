import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'strava' | 'line'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  fullWidth?: boolean
}

// 按鈕樣式對照表
const 樣式對照: Record<string, string> = {
  primary: 'bg-strava text-white hover:bg-orange-600 active:bg-orange-700',
  secondary: 'bg-gray-700 text-white hover:bg-gray-800',
  outline: 'border-2 border-strava text-strava hover:bg-strava/10',
  ghost: 'text-gray-600 hover:bg-gray-100',
  strava: 'bg-strava text-white hover:bg-orange-600',
  line: 'bg-line text-white hover:bg-green-600',
}

// 按鈕尺寸對照表
const 尺寸對照: Record<string, string> = {
  sm: 'px-3 py-2 text-sm min-h-[36px]',
  md: 'px-4 py-2.5 text-base min-h-[44px]',
  lg: 'px-6 py-3 text-lg min-h-[48px]',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium cursor-pointer
        transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strava/50 focus-visible:ring-offset-2
        ${樣式對照[variant]} ${尺寸對照[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

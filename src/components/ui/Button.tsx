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
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
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
        inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed
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

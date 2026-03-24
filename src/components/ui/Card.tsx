import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: boolean
}

// 通用卡片容器元件
export default function Card({ children, padding = true, className = '', ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-xl bg-white shadow-md
        ${padding ? 'p-4' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

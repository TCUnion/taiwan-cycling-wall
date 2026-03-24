import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

// 通用輸入欄位元件，支援標籤與錯誤訊息
export default function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || label
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          rounded-lg border border-gray-300 px-3 py-2 text-base
          focus:border-strava focus:outline-none focus:ring-2 focus:ring-strava/20
          placeholder:text-gray-400
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

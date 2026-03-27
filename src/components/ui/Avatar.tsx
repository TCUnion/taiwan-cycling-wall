interface AvatarProps {
  emoji: string  // emoji 字元或圖片網址
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// 頭像尺寸對照表
const 尺寸: Record<string, string> = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-10 h-10 text-xl',
  lg: 'w-14 h-14 text-3xl',
}

// 判斷是否為安全網址（僅允許 http/https，阻擋 javascript: / data: 等）
const 是安全網址 = (s: string) => /^https?:\/\//i.test(s?.trim?.() ?? '')

// 頭像元件 — 支援 emoji 與圖片網址
export default function Avatar({ emoji, size = 'md', className = '' }: AvatarProps) {
  if (是安全網址(emoji)) {
    return (
      <img
        src={emoji}
        alt="頭像"
        referrerPolicy="no-referrer"
        className={`rounded-xl object-cover bg-gray-100 ${尺寸[size]} ${className}`}
      />
    )
  }

  return (
    <div className={`flex items-center justify-center rounded-xl bg-gray-100 ${尺寸[size]} ${className}`}>
      {emoji}
    </div>
  )
}

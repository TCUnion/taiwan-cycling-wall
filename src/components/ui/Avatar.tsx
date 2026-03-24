interface AvatarProps {
  emoji: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// 頭像尺寸對照表
const 尺寸: Record<string, string> = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-10 h-10 text-xl',
  lg: 'w-14 h-14 text-3xl',
}

// Emoji 頭像元件
export default function Avatar({ emoji, size = 'md', className = '' }: AvatarProps) {
  return (
    <div className={`flex items-center justify-center rounded-full bg-gray-100 ${尺寸[size]} ${className}`}>
      {emoji}
    </div>
  )
}

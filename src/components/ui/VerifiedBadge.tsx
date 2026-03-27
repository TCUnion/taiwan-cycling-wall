import { ShieldCheck } from 'lucide-react'

interface Props {
  size?: 'sm' | 'md'
  className?: string
}

/** TCU 認證車手 Badge */
export default function VerifiedBadge({ size = 'sm', className = '' }: Props) {
  const px = size === 'sm' ? 14 : 16

  return (
    <span
      className={`inline-flex items-center text-emerald-600 ${className}`}
      title="TCU 認證車手"
      aria-label="TCU 認證車手"
    >
      <ShieldCheck size={px} />
    </span>
  )
}

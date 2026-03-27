import { ExternalLink } from 'lucide-react'
import type { AdPlacement } from '../../types'
import { 安全URL, 淨化純文字 } from '../../utils/sanitize'

interface Props {
  廣告: AdPlacement
}

export default function AdCard({ 廣告 }: Props) {
  const 連結 = 安全URL(廣告.product_url)
  return (
    <a
      href={連結 ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="
        relative w-full text-left rounded-sm shadow-md
        bg-white/90 border border-gray-200
        hover:shadow-lg motion-safe:hover:scale-105 hover:z-10
        transition-[transform,box-shadow] duration-200 cursor-pointer
        p-3 block
      "
    >
      {/* 廣告標記 */}
      <span className="absolute top-1 right-1 text-[10px] text-gray-400 bg-white/80 px-1 rounded">
        AD
      </span>

      {/* 左右佈局：圖片 + 文字 */}
      <div className="flex gap-3">
        {/* 左：產品圖片 */}
        <div className="w-24 self-stretch shrink-0 rounded overflow-hidden bg-gray-50">
          <img
            src={安全URL(廣告.image_url) ?? ''}
            alt={淨化純文字(廣告.product_name)}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>

        {/* 右：文字內容 */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400">{廣告.brand_name}</p>
          <h3 className="font-bold text-xs leading-tight mb-1 line-clamp-2">
            {廣告.product_name}
          </h3>
          <p className="text-[10px] text-gray-500 line-clamp-3 mb-1.5">
            {廣告.placement_text}
          </p>
          <span className="inline-flex items-center gap-1 text-xs text-strava font-medium">
            查看商品 <ExternalLink size={10} />
          </span>
        </div>
      </div>
    </a>
  )
}

import { ExternalLink } from 'lucide-react'
import type { AdPlacement } from '../../types'

interface Props {
  廣告: AdPlacement
}

export default function AdCard({ 廣告 }: Props) {
  return (
    <a
      href={廣告.product_url}
      target="_blank"
      rel="noopener noreferrer"
      className="
        relative w-full text-left rounded-sm shadow-md
        bg-white/90 border border-gray-200
        hover:shadow-lg hover:scale-105 hover:z-10
        transition-all duration-200 cursor-pointer
        p-3 block
      "
    >
      {/* 廣告標記 */}
      <span className="absolute top-1 right-1 text-[10px] text-gray-400 bg-white/80 px-1 rounded">
        AD
      </span>

      {/* 產品圖片 — 小尺寸，符合便利貼比例 */}
      <div className="w-full h-24 rounded overflow-hidden mb-2 bg-gray-50">
        <img
          src={廣告.image_url}
          alt={廣告.product_name}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>

      {/* 品牌 + 產品名 */}
      <p className="text-[10px] text-gray-400">{廣告.brand_name}</p>
      <h3 className="font-bold text-xs leading-tight mb-1 line-clamp-2">
        {廣告.product_name}
      </h3>

      {/* 短描述 */}
      <p className="text-[10px] text-gray-500 line-clamp-2 mb-1.5">
        {廣告.placement_text}
      </p>

      {/* 查看連結 */}
      <span className="inline-flex items-center gap-1 text-xs text-strava font-medium">
        查看商品 <ExternalLink size={10} />
      </span>
    </a>
  )
}

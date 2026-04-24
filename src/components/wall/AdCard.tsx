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
        relative block min-h-[178px] w-full overflow-hidden border border-siokiu-border
        bg-siokiu-paper/95 p-3 text-left text-siokiu-ink
        shadow-[0_4px_10px_rgba(60,40,20,0.18),0_1px_2px_rgba(60,40,20,0.12)]
        hover:z-10 hover:shadow-[0_8px_18px_rgba(60,40,20,0.24),0_2px_5px_rgba(60,40,20,0.16)]
        motion-safe:hover:scale-[1.025]
        transition-[transform,box-shadow] duration-200 cursor-pointer
      "
    >
      {/* 廣告標記 */}
      <span className="absolute right-1 top-1 z-10 bg-siokiu-ink px-1.5 py-0.5 font-mono text-[0.58rem] tracking-[0.12em] text-siokiu-paper">
        AD
      </span>

      {/* 上下佈局：圖片在上、文字在下（適合窄格子） */}
      <div className="flex flex-col gap-2">
        {/* 產品圖片 */}
        <div className="aspect-[4/3] w-full overflow-hidden bg-white/60">
          <img
            src={安全URL(廣告.image_url) ?? ''}
            alt={淨化純文字(廣告.product_name)}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>

        {/* 文字內容 */}
        <div className="min-w-0">
          <p className="siokiu-eyebrow truncate text-siokiu-smoke">{淨化純文字(廣告.brand_name)}</p>
          <h3 className="mb-1 line-clamp-2 font-serif text-sm font-black leading-tight tracking-normal">
            {淨化純文字(廣告.product_name)}
          </h3>
          <span className="inline-flex items-center gap-1 text-[0.68rem] font-medium text-siokiu-red">
            查看商品 <ExternalLink size={10} />
          </span>
        </div>
      </div>
    </a>
  )
}

import { forwardRef } from 'react'
import type { CyclingEvent } from '../../types'
import { 查找縣市 } from '../../data/counties'
import { 格式化完整日期 } from '../../utils/formatters'
import { 區域背景色 } from '../../utils/regionMapping'

interface Props {
  活動: CyclingEvent
}

const 便利貼色: Record<string, string> = {
  yellow: '#FEF9C3',
  pink: '#FCE7F3',
  blue: '#DBEAFE',
  green: '#DCFCE7',
}

// OG 圖片模板 — 用於 html-to-image 截取
const OGImageGenerator = forwardRef<HTMLDivElement, Props>(({ 活動 }, ref) => {
  const 縣市 = 查找縣市(活動.countyId)

  return (
    <div
      ref={ref}
      style={{
        width: 1200,
        height: 630,
        background: `linear-gradient(135deg, #D4A574 0%, #B8895A 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Noto Sans TC", sans-serif',
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
      }}
    >
      {/* 便利貼主體 */}
      <div
        style={{
          width: 1000,
          height: 500,
          background: 便利貼色[活動.stickyColor],
          borderRadius: 8,
          padding: 48,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          position: 'relative',
        }}
      >
        {/* 區域色帶 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            borderRadius: '8px 8px 0 0',
          }}
          className={區域背景色[活動.region]}
        />

        {/* 上半部 */}
        <div>
          <div style={{ fontSize: 20, color: '#6b7280', marginBottom: 8 }}>
            🚴 台灣約騎事件簿
          </div>
          <div style={{ fontSize: 48, fontWeight: 700, color: '#1f2937', lineHeight: 1.2 }}>
            {活動.title}
          </div>
        </div>

        {/* 下半部 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 22, color: '#374151', lineHeight: 1.8 }}>
            <div>📅 {格式化完整日期(活動.date)} {活動.time}</div>
            <div>📍 {縣市?.name} · {活動.meetingPoint}</div>
            <div>🛣️ {活動.distance}km / ⛰️ {活動.elevation}m / 👥 {活動.participants.length}人</div>
          </div>

          {/* 縣市印章 */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: '4px solid #DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              color: '#DC2626',
              transform: 'rotate(-15deg)',
              opacity: 0.7,
            }}
          >
            {縣市?.name}
          </div>
        </div>
      </div>
    </div>
  )
})

OGImageGenerator.displayName = 'OGImageGenerator'
export default OGImageGenerator

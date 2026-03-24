import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  開啟: boolean
  關閉: () => void
  標題?: string
  children: ReactNode
}

// 通用互動對話框元件，支援行動裝置底部彈出樣式
export default function Modal({ 開啟, 關閉, 標題, children }: ModalProps) {
  // 按下 ESC 鍵關閉對話框
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') 關閉()
    }
    if (開啟) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [開啟, 關閉])

  if (!開啟) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 背景遮罩 */}
      <div className="fixed inset-0 bg-black/50" onClick={關閉} />
      {/* 對話框內容 */}
      <div className="relative z-10 w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          {標題 && <h2 className="text-lg font-bold">{標題}</h2>}
          <button onClick={關閉} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

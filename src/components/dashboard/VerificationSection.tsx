// 個人中心 — TCU 認證區塊

import { useState, useCallback } from 'react'
import { ShieldCheck, ExternalLink, Loader2, Copy, Check } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { 建立認證請求 } from '../../utils/verificationService'
import { useVerificationPolling } from '../../hooks/useVerificationPolling'
import VerifiedBadge from '../ui/VerifiedBadge'

const LIFF_ID = import.meta.env.VITE_LIFF_ID as string | undefined

export default function VerificationSection() {
  const { 使用者, 更新使用者 } = useAuthStore()
  const [token, setToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [申請中, set申請中] = useState(false)
  const [已複製, set已複製] = useState(false)

  const 已認證 = !!使用者?.verifiedAt
  const 認證中 = !!token

  // 輪詢：verified 時更新本地使用者
  const 處理認證完成 = useCallback(() => {
    更新使用者({ verifiedAt: new Date().toISOString() })
    setToken(null)
    setExpiresAt(null)
  }, [更新使用者])

  useVerificationPolling({
    token,
    enabled: 認證中,
    onVerified: 處理認證完成,
  })

  if (!使用者) return null

  // 申請認證
  const 處理申請 = async () => {
    set申請中(true)
    const 結果 = await 建立認證請求(使用者.id)
    set申請中(false)
    if (結果) {
      setToken(結果.token)
      setExpiresAt(結果.expiresAt)
    }
  }

  // 複製認證碼
  const 複製認證碼 = async () => {
    if (!token) return
    await navigator.clipboard.writeText(token)
    set已複製(true)
    setTimeout(() => set已複製(false), 2000)
  }

  // 計算剩餘秒數
  const 剩餘秒數 = expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 0
  const 剩餘分鐘 = Math.floor(剩餘秒數 / 60)
  const 剩餘秒 = 剩餘秒數 % 60

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck size={16} className="text-emerald-600" />
        <h3 className="font-bold text-gray-800">TCU 認證</h3>
      </div>

      {/* 已認證 */}
      {已認證 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <VerifiedBadge size="md" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-700">TCU 認證車手</p>
            <p className="text-xs text-emerald-600/70">
              認證時間：{new Date(使用者.verifiedAt!).toLocaleDateString('zh-TW')}
            </p>
          </div>
        </div>
      )}

      {/* 認證中 — 顯示認證碼 + 前往 LINE@ */}
      {!已認證 && 認證中 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            請在 TCU LINE@ 聊天室中開啟認證頁面，輸入以下認證碼：
          </p>

          {/* 認證碼 */}
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-mono font-bold tracking-[0.3em] text-gray-800">
              {token}
            </span>
            <button
              onClick={複製認證碼}
              aria-label="複製認證碼"
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer transition-colors"
            >
              {已複製 ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            </button>
          </div>

          {/* 倒數 */}
          <p className="text-center text-xs text-gray-400">
            有效時間：{剩餘分鐘}:{剩餘秒.toString().padStart(2, '0')}
          </p>

          {/* 開啟 LIFF 認證頁面（自帶認證碼） */}
          <a
            href={LIFF_ID ? `https://liff.line.me/${LIFF_ID}?code=${token}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-line text-white font-medium cursor-pointer hover:opacity-90 transition-opacity"
          >
            <ExternalLink size={16} />
            開啟 LINE 認證頁面
          </a>

          <p className="text-center text-xs text-gray-400">
            等待認證完成中…
            <Loader2 size={12} className="inline ml-1 animate-spin" />
          </p>
        </div>
      )}

      {/* 未認證 — 申請按鈕 */}
      {!已認證 && !認證中 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            透過 TCU LINE@ 完成認證，你的約騎便利貼將顯示認證徽章
          </p>
          <button
            onClick={處理申請}
            disabled={申請中}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium cursor-pointer hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {申請中 ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ShieldCheck size={16} />
            )}
            申請 TCU 認證
          </button>
        </div>
      )}
    </div>
  )
}

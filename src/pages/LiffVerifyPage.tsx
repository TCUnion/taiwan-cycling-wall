// LIFF 認證頁面 — 在 LINE@ 聊天室中開啟

import { useState, useEffect } from 'react'
import { ShieldCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { 初始化LIFF, 取得LINE使用者, 關閉LIFF } from '../utils/liff'
import { 驗證認證碼 } from '../utils/verificationService'

type 頁面狀態 = '載入中' | '輸入認證碼' | '驗證中' | '成功' | '失敗'

export default function LiffVerifyPage() {
  const [狀態, set狀態] = useState<頁面狀態>('載入中')
  const [認證碼, set認證碼] = useState('')
  const [錯誤訊息, set錯誤訊息] = useState('')
  const [lineUserId, setLineUserId] = useState('')

  // 初始化 LIFF + 取得使用者
  useEffect(() => {
    async function init() {
      const ok = await 初始化LIFF()
      if (!ok) {
        set狀態('失敗')
        set錯誤訊息('LIFF 初始化失敗，請確認從 LINE 開啟此頁面')
        return
      }
      const 使用者 = await 取得LINE使用者()
      if (!使用者) {
        // login() 會跳轉，這裡不需要處理
        return
      }
      setLineUserId(使用者.userId)
      set狀態('輸入認證碼')
    }
    init()
  }, [])

  const 送出驗證 = async () => {
    if (認證碼.length !== 6) return
    set狀態('驗證中')

    const 結果 = await 驗證認證碼(認證碼.trim(), lineUserId)
    if (結果.success) {
      set狀態('成功')
    } else {
      set狀態('失敗')
      set錯誤訊息(結果.message)
    }
  }

  return (
    <div className="min-h-svh bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 space-y-6">
        {/* Logo 區 */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-3">
            <ShieldCheck size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">TCU 車手認證</h1>
          <p className="text-sm text-gray-500 mt-1">Taiwan Cyclist United</p>
        </div>

        {/* 載入中 */}
        {狀態 === '載入中' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 size={32} className="text-emerald-600 animate-spin" />
            <p className="text-sm text-gray-500">正在初始化…</p>
          </div>
        )}

        {/* 輸入認證碼 */}
        {狀態 === '輸入認證碼' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              請輸入約騎公布欄個人中心顯示的 6 位數認證碼
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={認證碼}
              onChange={e => set認證碼(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center text-3xl font-mono tracking-[0.5em] py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 transition-colors"
              autoFocus
            />
            <button
              onClick={送出驗證}
              disabled={認證碼.length !== 6}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-medium cursor-pointer hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              送出驗證
            </button>
          </div>
        )}

        {/* 驗證中 */}
        {狀態 === '驗證中' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 size={32} className="text-emerald-600 animate-spin" />
            <p className="text-sm text-gray-500">驗證中…</p>
          </div>
        )}

        {/* 成功 */}
        {狀態 === '成功' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 size={48} className="text-emerald-600" />
            <p className="text-lg font-bold text-emerald-700">認證成功！</p>
            <p className="text-sm text-gray-500 text-center">
              你已成為 TCU 認證車手，返回約騎公布欄即可看到認證徽章
            </p>
            <button
              onClick={關閉LIFF}
              className="mt-2 px-6 py-2 rounded-xl bg-emerald-600 text-white font-medium cursor-pointer hover:bg-emerald-700 transition-colors"
            >
              關閉視窗
            </button>
          </div>
        )}

        {/* 失敗 */}
        {狀態 === '失敗' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <XCircle size={48} className="text-red-400" />
            <p className="text-lg font-bold text-red-600">認證失敗</p>
            <p className="text-sm text-gray-500 text-center">{錯誤訊息}</p>
            <button
              onClick={() => { set狀態('輸入認證碼'); set認證碼(''); set錯誤訊息('') }}
              className="mt-2 px-6 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium cursor-pointer hover:bg-gray-50 transition-colors"
            >
              重新輸入
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

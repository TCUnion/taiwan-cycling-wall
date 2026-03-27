import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import Modal from './Modal'
import Avatar from './Avatar'
import Button from './Button'
import { ShieldCheck, Merge, X } from 'lucide-react'

// 登入提供者中文對照
const 提供者名稱: Record<string, string> = {
  facebook: 'Facebook',
  google: 'Google',
  line: 'LINE',
  strava: 'Strava',
}

export default function MergeAccountModal() {
  const 待合併帳號 = useAuthStore(s => s.待合併帳號)
  const 執行合併 = useAuthStore(s => s.執行合併)
  const 取消合併 = useAuthStore(s => s.取消合併)
  const [合併中, set合併中] = useState(false)
  const [結果, set結果] = useState<'success' | 'error' | null>(null)

  if (!待合併帳號) return null

  const { 舊帳號, email } = 待合併帳號
  const 提供者 = 提供者名稱[舊帳號.authProvider ?? ''] ?? '其他'
  const 已認證 = !!舊帳號.verifiedAt

  const 處理合併 = async () => {
    set合併中(true)
    const 成功 = await 執行合併()
    set結果(成功 ? 'success' : 'error')
    set合併中(false)
    if (成功) {
      setTimeout(() => { set結果(null) }, 1500)
    }
  }

  const 處理關閉 = () => {
    set結果(null)
    取消合併()
  }

  // 合併成功
  if (結果 === 'success') {
    return (
      <Modal 開啟 標題="合併完成" 關閉={處理關閉}>
        <div className="text-center py-4">
          <Merge size={48} className="mx-auto text-emerald-600 mb-3" />
          <p className="text-gray-700">帳號已成功合併！</p>
          <p className="text-sm text-gray-500 mt-1">舊帳號的活動、範本、認證狀態已全部轉移</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal 開啟 標題="偵測到相同帳號" 關閉={處理關閉}>
      <div className="space-y-4">
        <p className="text-gray-700">
          偵測到 <span className="font-semibold">{email}</span> 已有一個以{' '}
          <span className="font-semibold">{提供者}</span> 登入的帳號，是否合併？
        </p>

        {/* 舊帳號資訊 */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <Avatar emoji={舊帳號.avatar ?? ''} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium truncate">{舊帳號.name}</span>
              {已認證 && <ShieldCheck size={14} className="text-emerald-600 shrink-0" />}
            </div>
            <div className="text-sm text-gray-500">{提供者} 帳號</div>
            <div className="text-xs text-gray-400">ID: {舊帳號.id}</div>
          </div>
        </div>

        {/* 合併說明 */}
        <div className="text-sm text-gray-500 space-y-1">
          <p>合併後，舊帳號的以下資料將轉移到目前帳號：</p>
          <ul className="list-disc list-inside ml-1 space-y-0.5">
            <li>發起的約騎活動</li>
            <li>儲存的範本</li>
            {已認證 && <li className="text-emerald-600 font-medium">LINE 認證狀態</li>}
          </ul>
        </div>

        {結果 === 'error' && (
          <p className="text-sm text-red-500">合併失敗，請稍後再試</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={處理關閉}
            disabled={合併中}
          >
            <X size={16} className="mr-1" />
            保持獨立
          </Button>
          <Button
            className="flex-1"
            onClick={處理合併}
            disabled={合併中}
          >
            <Merge size={16} className="mr-1" />
            {合併中 ? '合併中…' : '合併帳號'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

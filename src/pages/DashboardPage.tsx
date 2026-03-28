// 個人中心頁面 — 單頁滾動式

import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Users, History, ChevronRight, Pencil, Check, X, ArrowLeftRight, Camera, ZoomIn, ZoomOut, RotateCcw, Plus } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useEventStore } from '../stores/eventStore'
import { 模擬追蹤, 模擬粉絲 } from '../data/mockUsers'
import { 查找縣市, 縣市列表 } from '../data/counties'
import Avatar from '../components/ui/Avatar'
import VerificationSection from '../components/dashboard/VerificationSection'
import { 淨化純文字 } from '../utils/sanitize'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { 使用者, 登出, 目前身份, 使用中的粉絲頁, 切換到粉絲頁, 切換回個人 } = useAuthStore()
  const { 活動列表 } = useEventStore()
  const [顯示身份切換, set顯示身份切換] = useState(false)

  if (!使用者) return null

  const 處理登出 = () => {
    登出()
    navigate('/login', { replace: true })
  }

  // 包含個人與粉絲頁發起的活動
  const 我的粉絲頁Ids = (使用者.managedPages ?? []).map(p => `page-${p.pageId}`)
  const 我的活動 = 活動列表.filter(e => e.creatorId === 使用者.id || 我的粉絲頁Ids.includes(e.creatorId))
  const 追蹤中 = 模擬追蹤[使用者.id] ?? []
  const 粉絲 = 模擬粉絲[使用者.id] ?? []

  return (
    <div className="min-h-svh bg-cork pb-20">
      {/* 頂部個人資訊 */}
      <div className="bg-white/80 backdrop-blur-sm px-4 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <Avatar emoji={使用者.avatar} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{使用者.name}</h1>
            <p className="text-sm text-gray-500">
              {查找縣市(使用者.countyId)?.name ?? 使用者.countyId}
            </p>
          </div>
          <button
            onClick={處理登出}
            aria-label="登出"
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* 目前身份 + 切換按鈕 */}
        {使用者.managedPages && 使用者.managedPages.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">目前身份：</span>
              {目前身份 === 'page' && 使用中的粉絲頁 ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-strava">
                  {使用中的粉絲頁.pictureUrl ? (
                    <img src={使用中的粉絲頁.pictureUrl} alt={使用中的粉絲頁.name} className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : null}
                  {使用中的粉絲頁.name}
                </span>
              ) : (
                <span className="text-sm font-medium">個人帳號</span>
              )}
              <button
                onClick={() => set顯示身份切換(!顯示身份切換)}
                aria-label="切換身份"
                className="ml-auto inline-flex items-center gap-1 text-xs text-strava cursor-pointer hover:text-orange-600 transition-colors"
              >
                <ArrowLeftRight size={14} /> 切換身份
              </button>
            </div>

            {顯示身份切換 && (
              <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                {/* 個人帳號選項 */}
                <button
                  onClick={() => { 切換回個人(); set顯示身份切換(false) }}
                  className={`w-full flex items-center gap-3 rounded-lg p-2 text-left cursor-pointer transition-colors ${
                    目前身份 === 'personal' ? 'bg-strava/10 border border-strava/30' : 'hover:bg-gray-50'
                  }`}
                >
                  <Avatar emoji={使用者.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{使用者.name}</p>
                    <p className="text-xs text-gray-500">個人帳號</p>
                  </div>
                  {目前身份 === 'personal' && <Check size={16} className="text-strava shrink-0" />}
                </button>
                {/* 粉絲頁列表 */}
                {使用者.managedPages.map(page => (
                  <button
                    key={page.pageId}
                    onClick={() => { 切換到粉絲頁(page.pageId); set顯示身份切換(false) }}
                    className={`w-full flex items-center gap-3 rounded-lg p-2 text-left cursor-pointer transition-colors ${
                      目前身份 === 'page' && 使用中的粉絲頁?.pageId === page.pageId ? 'bg-strava/10 border border-strava/30' : 'hover:bg-gray-50'
                    }`}
                  >
                    {page.pictureUrl ? (
                      <img src={page.pictureUrl} alt={page.name} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"><Users size={14} className="text-gray-400" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{page.name}</p>
                      <p className="text-xs text-gray-500">粉絲頁</p>
                    </div>
                    {目前身份 === 'page' && 使用中的粉絲頁?.pageId === page.pageId && (
                      <Check size={16} className="text-strava shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* 基本資訊 */}
        <個人資料區塊 />

        {/* LINE 認證 */}
        <VerificationSection />

        {/* 追蹤 / 粉絲 */}
        <粉絲區塊 追蹤中={追蹤中} 粉絲={粉絲} />

        {/* 發起紀錄 */}
        <區塊標題 icon={History} title="發起紀錄" count={我的活動.length} />
        {我的活動.length === 0 ? (
          <空白提示>尚無發起紀錄</空白提示>
        ) : (
          <div className="space-y-2">
            {我的活動.map(e => (
              <button
                key={e.id}
                onClick={() => navigate(`/event/${e.id}`)}
                className="w-full flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm text-left cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{e.title}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(e.date), 'yyyy/MM/dd', { locale: zhTW })} · {查找縣市(e.countyId)?.name} · {e.distance}km
                  </p>
                </div>
                <div className="text-xs text-gray-500 shrink-0">
                  上限 {e.maxParticipants} 人
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* 發起約騎 */}
        <button
          onClick={() => navigate('/create')}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-strava text-white py-3 shadow-sm font-medium cursor-pointer hover:bg-orange-600 transition-colors"
        >
          <Plus size={18} /> 發起約騎
        </button>
      </div>
    </div>
  )
}

/* ─── 區塊標題 ─── */
function 區塊標題({ icon: Icon, title, count }: { icon: typeof History; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <Icon size={16} className="text-gray-500" />
      <h3 className="font-bold text-gray-800">{title}</h3>
      <span className="text-xs text-gray-500">({count})</span>
    </div>
  )
}

/* ─── 空白提示 ─── */
function 空白提示({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-sm text-gray-500 py-6">{children}</p>
}

/* ─── 個人資料區塊（可編輯） ─── */
function 個人資料區塊() {
  const { 使用者, 更新使用者 } = useAuthStore()
  const [編輯中, set編輯中] = useState(false)
  const [編輯姓名, set編輯姓名] = useState('')
  const [編輯縣市, set編輯縣市] = useState('')
  const [預覽頭像, set預覽頭像] = useState<string | null>(null)
  const [原始圖片, set原始圖片] = useState<string | null>(null)
  const [裁切縮放, set裁切縮放] = useState(1)
  const [裁切位移, set裁切位移] = useState({ x: 0, y: 0 })
  const [拖曳中, set拖曳中] = useState(false)
  const 拖曳起點 = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const 檔案輸入Ref = useRef<HTMLInputElement>(null)

  // 圖章相關 state
  const [預覽圖章, set預覽圖章] = useState<string | null>(null)
  const [圖章原始圖片, set圖章原始圖片] = useState<string | null>(null)
  const [圖章裁切縮放, set圖章裁切縮放] = useState(1)
  const [圖章裁切位移, set圖章裁切位移] = useState({ x: 0, y: 0 })
  const [圖章拖曳中, set圖章拖曳中] = useState(false)
  const 圖章拖曳起點 = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const 圖章檔案輸入Ref = useRef<HTMLInputElement>(null)

  if (!使用者) return null
  const 縣市名稱 = 查找縣市(使用者.countyId)?.name ?? (使用者.countyId || '尚未設定')

  const 開始編輯 = () => { set編輯姓名(使用者.name); set編輯縣市(使用者.countyId); set預覽頭像(null); set原始圖片(null); set預覽圖章(null); set圖章原始圖片(null); set編輯中(true) }
  const 儲存編輯 = () => {
    if (!編輯姓名.trim()) return
    const 更新資料: Record<string, string | undefined> = { name: 淨化純文字(編輯姓名.trim()), countyId: 編輯縣市 }
    if (預覽頭像) 更新資料.avatar = 預覽頭像
    if (預覽圖章 !== null) 更新資料.stampImage = 預覽圖章 || undefined
    更新使用者(更新資料)
    set編輯中(false)
  }

  // 選檔後開啟裁切編輯器
  const 處理圖片選擇 = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      set原始圖片(reader.result as string)
      set裁切縮放(1)
      set裁切位移({ x: 0, y: 0 })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  // 裁切確認 → 產出 200×200 PNG base64
  const 確認裁切 = useCallback(() => {
    if (!原始圖片) return
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')!
      // 預覽區域 200px，圖片短邊 fit 200px，再套用縮放與位移
      const 短邊 = Math.min(img.width, img.height)
      const 基礎比例 = 短邊 / 200
      const 實際比例 = 基礎比例 / 裁切縮放
      const cx = img.width / 2 - 裁切位移.x * 基礎比例
      const cy = img.height / 2 - 裁切位移.y * 基礎比例
      const 半徑 = 100 * 實際比例
      ctx.drawImage(img, cx - 半徑, cy - 半徑, 半徑 * 2, 半徑 * 2, 0, 0, 200, 200)
      set預覽頭像(canvas.toDataURL('image/png'))
      set原始圖片(null)
    }
    img.src = 原始圖片
  }, [原始圖片, 裁切縮放, 裁切位移])

  // 拖曳事件（支援滑鼠與觸控）
  const 開始拖曳 = useCallback((clientX: number, clientY: number) => {
    set拖曳中(true)
    拖曳起點.current = { x: clientX, y: clientY, ox: 裁切位移.x, oy: 裁切位移.y }
  }, [裁切位移])

  const 移動中 = useCallback((clientX: number, clientY: number) => {
    if (!拖曳中) return
    const dx = clientX - 拖曳起點.current.x
    const dy = clientY - 拖曳起點.current.y
    set裁切位移({ x: 拖曳起點.current.ox + dx, y: 拖曳起點.current.oy + dy })
  }, [拖曳中])

  const 結束拖曳 = useCallback(() => set拖曳中(false), [])

  // 圖章選檔
  const 處理圖章選擇 = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      set圖章原始圖片(reader.result as string)
      set圖章裁切縮放(1)
      set圖章裁切位移({ x: 0, y: 0 })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  // 圖章裁切確認 → 200×200 PNG
  const 確認圖章裁切 = useCallback(() => {
    if (!圖章原始圖片) return
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')!
      const 短邊 = Math.min(img.width, img.height)
      const 基礎比例 = 短邊 / 200
      const 實際比例 = 基礎比例 / 圖章裁切縮放
      const cx = img.width / 2 - 圖章裁切位移.x * 基礎比例
      const cy = img.height / 2 - 圖章裁切位移.y * 基礎比例
      const 半徑 = 100 * 實際比例
      ctx.drawImage(img, cx - 半徑, cy - 半徑, 半徑 * 2, 半徑 * 2, 0, 0, 200, 200)
      set預覽圖章(canvas.toDataURL('image/png'))
      set圖章原始圖片(null)
    }
    img.src = 圖章原始圖片
  }, [圖章原始圖片, 圖章裁切縮放, 圖章裁切位移])

  // 圖章拖曳
  const 開始圖章拖曳 = useCallback((clientX: number, clientY: number) => {
    set圖章拖曳中(true)
    圖章拖曳起點.current = { x: clientX, y: clientY, ox: 圖章裁切位移.x, oy: 圖章裁切位移.y }
  }, [圖章裁切位移])

  const 圖章移動中 = useCallback((clientX: number, clientY: number) => {
    if (!圖章拖曳中) return
    const dx = clientX - 圖章拖曳起點.current.x
    const dy = clientY - 圖章拖曳起點.current.y
    set圖章裁切位移({ x: 圖章拖曳起點.current.ox + dx, y: 圖章拖曳起點.current.oy + dy })
  }, [圖章拖曳中])

  const 結束圖章拖曳 = useCallback(() => set圖章拖曳中(false), [])

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800">基本資訊</h3>
        {編輯中 ? (
          <div className="flex gap-2">
            <button onClick={() => set編輯中(false)} className="flex items-center gap-1 text-sm text-gray-400 cursor-pointer hover:text-gray-600 transition-colors rounded focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:outline-none">
              <X size={14} /> 取消
            </button>
            <button onClick={儲存編輯} className="flex items-center gap-1 text-sm text-strava cursor-pointer hover:text-orange-600 transition-colors rounded focus-visible:ring-2 focus-visible:ring-strava/40 focus-visible:outline-none">
              <Check size={14} /> 儲存
            </button>
          </div>
        ) : (
          <button onClick={開始編輯} className="flex items-center gap-1 text-sm text-strava cursor-pointer hover:text-orange-600 transition-colors rounded focus-visible:ring-2 focus-visible:ring-strava/40 focus-visible:outline-none">
            <Pencil size={14} /> 編輯
          </button>
        )}
      </div>
      <div className="flex items-center justify-between py-2 border-b border-gray-100">
        <span className="text-sm text-gray-500">頭像</span>
        <div className="flex items-center gap-2">
          {編輯中 && (
            <>
              <button onClick={() => 檔案輸入Ref.current?.click()} aria-label="更換頭像"
                className="flex items-center gap-1 text-xs text-strava cursor-pointer hover:text-orange-600 transition-colors">
                <Camera size={14} /> 更換
              </button>
              {使用者.socialAvatar && (預覽頭像 ?? 使用者.avatar) !== 使用者.socialAvatar && (
                <button onClick={() => set預覽頭像(使用者.socialAvatar!)} aria-label="重設為預設頭像"
                  className="flex items-center gap-1 text-xs text-blue-500 cursor-pointer hover:text-blue-600 transition-colors">
                  <RotateCcw size={14} /> 重設為預設
                </button>
              )}
              <input ref={檔案輸入Ref} type="file" accept="image/*" name="avatar-file" onChange={處理圖片選擇} className="hidden" />
            </>
          )}
          <Avatar emoji={預覽頭像 ?? 使用者.avatar} size="md" />
        </div>
      </div>

      {/* 頭像裁切編輯器 */}
      {原始圖片 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" role="dialog" aria-modal="true" aria-label="調整頭像" onClick={() => set原始圖片(null)} onKeyDown={e => { if (e.key === 'Escape') set原始圖片(null) }}>
          <div className="bg-white rounded-2xl p-5 mx-4 w-full max-w-xs space-y-4" onClick={e => e.stopPropagation()}>
            <h4 className="text-center font-bold text-gray-800">調整頭像</h4>

            {/* 圓形預覽區 */}
            <div className="flex justify-center">
              <div className="relative w-[200px] h-[200px] rounded-3xl overflow-hidden border-2 border-gray-200 bg-gray-100 select-none touch-none"
                onMouseDown={e => 開始拖曳(e.clientX, e.clientY)}
                onMouseMove={e => 移動中(e.clientX, e.clientY)}
                onMouseUp={結束拖曳} onMouseLeave={結束拖曳}
                onTouchStart={e => { const t = e.touches[0]; 開始拖曳(t.clientX, t.clientY) }}
                onTouchMove={e => { const t = e.touches[0]; 移動中(t.clientX, t.clientY) }}
                onTouchEnd={結束拖曳}>
                <img src={原始圖片} alt="裁切預覽" draggable={false}
                  className="absolute pointer-events-none"
                  style={{
                    minWidth: '100%', minHeight: '100%',
                    width: `${裁切縮放 * 100}%`, height: `${裁切縮放 * 100}%`,
                    left: `${50 + (裁切位移.x / 200) * 100}%`,
                    top: `${50 + (裁切位移.y / 200) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    objectFit: 'cover',
                  }} />
              </div>
            </div>

            {/* 縮放滑桿 */}
            <div className="flex items-center gap-3 px-2">
              <ZoomOut size={16} className="text-gray-400 shrink-0" />
              <input type="range" min="1" max="3" step="0.05" name="avatar-zoom" aria-label="頭像縮放" value={裁切縮放}
                onChange={e => set裁切縮放(Number(e.target.value))}
                className="flex-1 accent-strava cursor-pointer" />
              <ZoomIn size={16} className="text-gray-400 shrink-0" />
            </div>
            <p className="text-center text-xs text-gray-400">拖曳圖片調整位置</p>

            {/* 操作按鈕 */}
            <div className="flex gap-3">
              <button onClick={() => set原始圖片(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors">
                取消
              </button>
              <button onClick={確認裁切}
                className="flex-1 py-2 rounded-lg bg-strava text-white text-sm font-medium cursor-pointer hover:bg-orange-600 transition-colors">
                確認
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 活動圖章 */}
      <div className="flex items-center justify-between py-2 border-b border-gray-100">
        <span className="text-sm text-gray-500">活動圖章</span>
        <div className="flex items-center gap-2">
          {編輯中 && (
            <>
              <button onClick={() => 圖章檔案輸入Ref.current?.click()} aria-label="更換圖章"
                className="flex items-center gap-1 text-xs text-strava cursor-pointer hover:text-orange-600 transition-colors">
                <Camera size={14} /> {使用者.stampImage || 預覽圖章 ? '更換' : '上傳'}
              </button>
              {(使用者.stampImage || 預覽圖章) && (
                <button onClick={() => set預覽圖章('')} aria-label="移除圖章"
                  className="flex items-center gap-1 text-xs text-red-400 cursor-pointer hover:text-red-600 transition-colors">
                  <X size={14} /> 移除
                </button>
              )}
              <input ref={圖章檔案輸入Ref} type="file" accept="image/*" name="stamp-file" onChange={處理圖章選擇} className="hidden" />
            </>
          )}
          {(() => {
            const 顯示圖章 = 預覽圖章 !== null ? 預覽圖章 : 使用者.stampImage
            return 顯示圖章 ? (
              <span className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden inline-flex items-center justify-center">
                <img src={顯示圖章} alt="活動圖章" className="w-full h-full object-cover" />
              </span>
            ) : (
              <span className="text-sm text-gray-400">尚未設定</span>
            )
          })()}
        </div>
      </div>

      {/* 圖章裁切編輯器 */}
      {圖章原始圖片 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" role="dialog" aria-modal="true" aria-label="調整圖章" onClick={() => set圖章原始圖片(null)} onKeyDown={e => { if (e.key === 'Escape') set圖章原始圖片(null) }}>
          <div className="bg-white rounded-2xl p-5 mx-4 w-full max-w-xs space-y-4" onClick={e => e.stopPropagation()}>
            <h4 className="text-center font-bold text-gray-800">調整圖章</h4>
            <div className="flex justify-center">
              <div className="relative w-[200px] h-[200px] rounded-3xl overflow-hidden border-2 border-gray-200 bg-gray-100 select-none touch-none"
                onMouseDown={e => 開始圖章拖曳(e.clientX, e.clientY)}
                onMouseMove={e => 圖章移動中(e.clientX, e.clientY)}
                onMouseUp={結束圖章拖曳} onMouseLeave={結束圖章拖曳}
                onTouchStart={e => { const t = e.touches[0]; 開始圖章拖曳(t.clientX, t.clientY) }}
                onTouchMove={e => { const t = e.touches[0]; 圖章移動中(t.clientX, t.clientY) }}
                onTouchEnd={結束圖章拖曳}>
                <img src={圖章原始圖片} alt="裁切預覽" draggable={false}
                  className="absolute pointer-events-none"
                  style={{
                    minWidth: '100%', minHeight: '100%',
                    width: `${圖章裁切縮放 * 100}%`, height: `${圖章裁切縮放 * 100}%`,
                    left: `${50 + (圖章裁切位移.x / 200) * 100}%`,
                    top: `${50 + (圖章裁切位移.y / 200) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    objectFit: 'cover',
                  }} />
              </div>
            </div>
            <div className="flex items-center gap-3 px-2">
              <ZoomOut size={16} className="text-gray-400 shrink-0" />
              <input type="range" min="1" max="3" step="0.05" name="stamp-zoom" aria-label="圖章縮放" value={圖章裁切縮放}
                onChange={e => set圖章裁切縮放(Number(e.target.value))}
                className="flex-1 accent-strava cursor-pointer" />
              <ZoomIn size={16} className="text-gray-400 shrink-0" />
            </div>
            <p className="text-center text-xs text-gray-400">拖曳圖片調整位置</p>
            <div className="flex gap-3">
              <button onClick={() => set圖章原始圖片(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors">
                取消
              </button>
              <button onClick={確認圖章裁切}
                className="flex-1 py-2 rounded-lg bg-strava text-white text-sm font-medium cursor-pointer hover:bg-orange-600 transition-colors">
                確認
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between py-2 border-b border-gray-100">
        <span className="text-sm text-gray-500">姓名</span>
        {編輯中 ? (
          <input value={編輯姓名} onChange={e => set編輯姓名(e.target.value)} maxLength={20}
            name="display-name" autoComplete="name"
            className="text-sm font-medium text-right border-b border-strava outline-none bg-transparent w-32 py-0.5 focus-visible:ring-2 focus-visible:ring-strava/40" />
        ) : (
          <span className="text-sm font-medium">{使用者.name}</span>
        )}
      </div>
      <div className="flex items-center justify-between py-2 border-b border-gray-100">
        <span className="text-sm text-gray-500">所在縣市</span>
        {編輯中 ? (
          <select name="county" value={編輯縣市} onChange={e => set編輯縣市(e.target.value)}
            className="text-sm font-medium text-right border-b border-strava outline-none bg-transparent focus-visible:ring-2 focus-visible:ring-strava/40">
            <option value="">請選擇</option>
            {縣市列表.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : (
          <span className="text-sm font-medium">{縣市名稱}</span>
        )}
      </div>
      {使用者.authProvider && (
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-500">登入方式</span>
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${
            ({ facebook: 'text-facebook', google: 'text-google', line: 'text-line', strava: 'text-strava' } as Record<string, string>)[使用者.authProvider] ?? 'text-gray-700'
          }`}>
            {使用者.authProvider === 'facebook' && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>}
            {使用者.authProvider === 'google' && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
            {使用者.authProvider === 'line' && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.271.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>}
            {使用者.authProvider === 'strava' && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>}
            {{ facebook: 'Facebook', google: 'Google', line: 'LINE', strava: 'Strava' }[使用者.authProvider]}
          </span>
        </div>
      )}
    </div>
  )
}

/* ─── 粉絲區塊 ─── */
function 粉絲區塊({ 追蹤中, 粉絲 }: { 追蹤中: import('../types').FollowRelation[]; 粉絲: import('../types').FollowRelation[] }) {
  const [顯示, set顯示] = useState<'追蹤中' | '粉絲'>('追蹤中')
  const 列表 = 顯示 === '追蹤中' ? 追蹤中 : 粉絲

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users size={16} className="text-gray-500" />
        <h3 className="font-bold text-gray-800">社群</h3>
      </div>
      <div className="flex rounded-lg bg-white p-1 shadow-sm">
        {(['追蹤中', '粉絲'] as const).map(tab => (
          <button key={tab} onClick={() => set顯示(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              顯示 === tab ? 'bg-strava text-white' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab} ({tab === '追蹤中' ? 追蹤中.length : 粉絲.length})
          </button>
        ))}
      </div>
      {列表.length === 0 ? (
        <空白提示>尚無{顯示}</空白提示>
      ) : (
        <div className="space-y-2">
          {列表.map(u => (
            <div key={u.userId} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
              <Avatar emoji={u.avatar} size="sm" />
              <span className="text-sm font-medium flex-1">{u.name}</span>
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

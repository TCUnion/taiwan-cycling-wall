// 個人中心頁面 — 單頁滾動式

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Users, History, Route, MapPin, Mountain, ChevronRight, Pencil, Check, X } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useEventStore } from '../stores/eventStore'
import { 模擬收藏路線, 模擬集合點, 模擬追蹤, 模擬粉絲 } from '../data/mockUsers'
import { 查找縣市, 縣市列表 } from '../data/counties'
import Avatar from '../components/ui/Avatar'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { 使用者, 登出 } = useAuthStore()
  const { 活動列表 } = useEventStore()

  if (!使用者) return null

  const 處理登出 = () => {
    登出()
    navigate('/login', { replace: true })
  }

  const 我的活動 = 活動列表.filter(e => e.creatorId === 使用者.id)
  const 收藏路線 = 模擬收藏路線[使用者.id] ?? []
  const 集合點 = 模擬集合點[使用者.id] ?? []
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
            <p className="text-xs text-gray-500 mt-0.5">
              {追蹤中.length} 追蹤中 · {粉絲.length} 粉絲
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
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* 基本資訊 */}
        <個人資料區塊 />

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
                  {e.participants.length}/{e.maxParticipants} 人
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* 個人路線 */}
        <區塊標題 icon={Route} title="個人路線" count={收藏路線.length} />
        {收藏路線.length === 0 ? (
          <空白提示>尚無收藏路線</空白提示>
        ) : (
          <div className="space-y-2">
            {收藏路線.map(r => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-50 text-strava">
                  <Route size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-xs text-gray-500">{查找縣市(r.countyId)?.name} · {r.distance}km</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                  <Mountain size={12} /> {r.elevation}m
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 集合點 */}
        <區塊標題 icon={MapPin} title="常用集合點" count={集合點.length} />
        {集合點.length === 0 ? (
          <空白提示>尚無常用集合點</空白提示>
        ) : (
          <div className="space-y-2">
            {集合點.map(s => (
              <a
                key={s.id}
                href={`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 text-green-600">
                  <MapPin size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-xs text-gray-500 truncate">{查找縣市(s.countyId)?.name} · {s.address}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </a>
            ))}
          </div>
        )}
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

  if (!使用者) return null
  const 縣市名稱 = 查找縣市(使用者.countyId)?.name ?? (使用者.countyId || '尚未設定')

  const 開始編輯 = () => { set編輯姓名(使用者.name); set編輯縣市(使用者.countyId); set編輯中(true) }
  const 儲存編輯 = () => { if (!編輯姓名.trim()) return; 更新使用者({ name: 編輯姓名.trim(), countyId: 編輯縣市 }); set編輯中(false) }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800">基本資訊</h3>
        {編輯中 ? (
          <div className="flex gap-2">
            <button onClick={() => set編輯中(false)} className="flex items-center gap-1 text-sm text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
              <X size={14} /> 取消
            </button>
            <button onClick={儲存編輯} className="flex items-center gap-1 text-sm text-strava cursor-pointer hover:text-orange-600 transition-colors">
              <Check size={14} /> 儲存
            </button>
          </div>
        ) : (
          <button onClick={開始編輯} className="flex items-center gap-1 text-sm text-strava cursor-pointer hover:text-orange-600 transition-colors">
            <Pencil size={14} /> 編輯
          </button>
        )}
      </div>
      <div className="flex items-center justify-between py-2 border-b border-gray-100">
        <span className="text-sm text-gray-500">頭像</span>
        <Avatar emoji={使用者.avatar} size="md" />
      </div>
      <div className="flex items-center justify-between py-2 border-b border-gray-100">
        <span className="text-sm text-gray-500">姓名</span>
        {編輯中 ? (
          <input value={編輯姓名} onChange={e => set編輯姓名(e.target.value)} maxLength={20}
            className="text-sm font-medium text-right border-b border-strava outline-none bg-transparent w-32 py-0.5" />
        ) : (
          <span className="text-sm font-medium">{使用者.name}</span>
        )}
      </div>
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-500">所在縣市</span>
        {編輯中 ? (
          <select name="county" value={編輯縣市} onChange={e => set編輯縣市(e.target.value)}
            className="text-sm font-medium text-right border-b border-strava outline-none bg-transparent">
            <option value="">請選擇</option>
            {縣市列表.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : (
          <span className="text-sm font-medium">{縣市名稱}</span>
        )}
      </div>
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

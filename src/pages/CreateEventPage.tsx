// 發起約騎頁面 — 支援範本快速填入與儲存

import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Bike, MapPin, X, Link, BookmarkPlus, Bookmark, Trash2, ImagePlus, Save } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useEventStore, 取得便利貼顏色 } from '../stores/eventStore'
import { useTemplateStore } from '../stores/templateStore'
import { 查找縣市, 縣市列表 } from '../data/counties'
import { 產生ID } from '../utils/formatters'
import type { CyclingEvent, RideTemplate } from '../types'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Avatar from '../components/ui/Avatar'

// 從文字推斷縣市
function 從文字推斷縣市(text: string): string {
  const decoded = decodeURIComponent(text)
  for (const c of 縣市列表) {
    if (decoded.includes(c.name)) return c.id
  }
  const 地名對照: Record<string, string> = {
    '中投': 'taichung', '草屯': 'nantou', '埔里': 'nantou', '南投': 'nantou',
    '林口': 'new-taipei', '大甲': 'taichung', '鳥嘴潭': 'nantou',
    '日月潭': 'nantou', '武嶺': 'nantou', '合歡山': 'nantou',
    '北宜': 'new-taipei', '陽明山': 'taipei', '碧潭': 'new-taipei',
    '旗津': 'kaohsiung', '墾丁': 'pingtung', '太魯閣': 'hualien',
  }
  for (const [地名, id] of Object.entries(地名對照)) {
    if (decoded.includes(地名)) return id
  }
  return ''
}

export default function CreateEventPage() {
  const navigate = useNavigate()
  const { id: editId } = useParams()
  const 使用者 = useAuthStore(s => s.使用者)
  const 取得目前發文身份 = useAuthStore(s => s.取得目前發文身份)
  const 目前身份 = 取得目前發文身份()
  const { 活動列表, 新增活動, 更新活動 } = useEventStore()
  const { 範本列表, 載入中, 載入範本, 新增範本, 刪除範本 } = useTemplateStore()

  // 載入共用範本
  useEffect(() => { 載入範本() }, [載入範本])

  if (!使用者) return null

  // 編輯模式：從 URL 取得既有活動
  const 編輯中活動 = editId ? 活動列表.find(e => e.id === editId) : undefined
  const 是編輯模式 = !!編輯中活動

  // 從 description 反解備註文字
  const 解析備註文字 = (desc: string): string => {
    const match = desc.match(/⚠️ 注意事項：\n([\s\S]*)$/)
    if (!match) return ''
    return match[1].replace(/^• /gm, '').trim()
  }
  const 解析路線描述 = (desc: string): string => {
    const match = desc.match(/🛣️ 路線：\n([\s\S]*?)(?=\n\n⚠️|$)/)
    return match ? match[1].trim() : ''
  }

  // 表單狀態（編輯模式用既有值）
  const [date, setDate] = useState(編輯中活動?.date ?? '')
  const [time, setTime] = useState(編輯中活動?.time ?? '06:00')
  const [發起人名稱, set發起人名稱] = useState(目前身份.name)
  const [routeName, setRouteName] = useState(編輯中活動?.title ?? '')
  const [routeDetail, setRouteDetail] = useState(編輯中活動 ? 解析路線描述(編輯中活動.description) : '')
  const [routeUrl, setRouteUrl] = useState(編輯中活動?.stravaRouteUrl ?? '')
  const [spotName, setSpotName] = useState(編輯中活動?.meetingPoint ?? '')
  const [spotUrl, setSpotUrl] = useState(編輯中活動?.meetingPointUrl ?? '')
  const [countyId, setCountyId] = useState(編輯中活動?.countyId ?? 使用者.countyId ?? '')
  const [coverImage, setCoverImage] = useState(編輯中活動?.coverImage ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [notes, setNotes] = useState(編輯中活動 ? 解析備註文字(編輯中活動.description) : '')
  const [distance, setDistance] = useState(編輯中活動?.distance ?? 0)
  const [elevation, setElevation] = useState(編輯中活動?.elevation ?? 0)
  const [pace, setPace] = useState(編輯中活動?.pace === '自由配速' ? '' : (編輯中活動?.pace ?? ''))
  const [maxParticipants, setMaxParticipants] = useState(編輯中活動?.maxParticipants ?? 0)

  // 範本 UI
  const [顯示範本, set顯示範本] = useState(false)
  const [範本縣市, set範本縣市] = useState('')
  const [儲存範本名, set儲存範本名] = useState('')
  const [顯示儲存, set顯示儲存] = useState(false)
  const 篩選後範本 = 範本列表.filter(t => !範本縣市 || t.countyId === 範本縣市)

  const 今天 = new Date().toISOString().split('T')[0]
  const 可提交 = routeName.trim() && date

  // 套用範本
  const 套用範本 = (t: RideTemplate) => {
    setRouteName(t.routeName)
    setRouteDetail(t.routeDetail)
    setRouteUrl(t.routeUrl)
    setSpotName(t.spotName)
    setSpotUrl(t.spotUrl)
    setCountyId(t.countyId)
    setTime(t.time)
    setDistance(t.distance)
    setElevation(t.elevation)
    setPace(t.pace)
    setMaxParticipants(t.maxParticipants)
    setNotes(t.notes.join('\n'))
    set顯示範本(false)
  }

  // 儲存為範本
  const 儲存為範本 = () => {
    if (!儲存範本名.trim()) return
    新增範本({
      id: `tpl-${Date.now()}`,
      name: 儲存範本名.trim(),
      routeName,
      routeDetail,
      routeUrl,
      spotName,
      spotUrl,
      countyId,
      time,
      distance,
      elevation,
      pace,
      maxParticipants,
      notes: notes.split('\n').filter(s => s.trim()),
      creatorId: 使用者.id,
      creatorName: 使用者.name,
    })
    set儲存範本名('')
    set顯示儲存(false)
  }

  // 圖片上傳（壓縮為 400×400 正方形裁切的 JPEG）
  const 處理圖片上傳 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = 400
        canvas.width = size
        canvas.height = size
        // 置中裁切為正方形
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
        setCoverImage(canvas.toDataURL('image/png'))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = '' // 重設以允許再次選同檔
  }

  // 推斷縣市
  const 處理路線名稱 = (v: string) => {
    setRouteName(v)
    if (!countyId) { const r = 從文字推斷縣市(v); if (r) setCountyId(r) }
  }
  const 處理集合點 = (name: string, url: string) => {
    setSpotName(name); setSpotUrl(url)
    if (!countyId) { const r = 從文字推斷縣市(name) || 從文字推斷縣市(url); if (r) setCountyId(r) }
  }

  // 過濾 http 連結（安全性）
  const 過濾連結 = (text: string) => text.replace(/https?:\/\/\S+/g, '[連結已移除]')

  const 提交 = () => {
    if (!使用者 || !可提交) return
    const 有效縣市 = countyId || 使用者.countyId || 'taipei'
    const 縣市 = 查找縣市(有效縣市)
    const 各段: string[] = []
    if (routeDetail.trim()) 各段.push(`🛣️ 路線：\n${routeDetail.trim()}`)
    const 安全備註 = 過濾連結(notes.trim())
    if (安全備註) 各段.push(`⚠️ 注意事項：\n${安全備註}`)

    if (是編輯模式 && editId) {
      // 編輯模式：更新既有活動
      更新活動(editId, {
        title: routeName.trim(),
        description: 各段.join('\n\n'),
        countyId: 有效縣市,
        region: 縣市?.region || '北部',
        date, time,
        meetingPoint: spotName.trim(),
        meetingPointUrl: spotUrl.trim() || undefined,
        distance, elevation,
        pace: pace || '自由配速',
        maxParticipants,
        stravaRouteUrl: routeUrl.trim() || undefined,
        coverImage: coverImage || undefined,
      })
      navigate(`/event/${editId}`, { replace: true })
      return
    }

    // 新建模式
    const id = 產生ID()
    const 新活動: CyclingEvent = {
      id,
      title: routeName.trim(),
      description: 各段.join('\n\n'),
      countyId: 有效縣市,
      region: 縣市?.region || '北部',
      date, time,
      meetingPoint: spotName.trim(),
      meetingPointUrl: spotUrl.trim() || undefined,
      distance, elevation,
      pace: pace || '自由配速',
      participants: [使用者.id],
      maxParticipants,
      stravaRouteUrl: routeUrl.trim() || undefined,
      coverImage: coverImage || undefined,
      stickyColor: 取得便利貼顏色(id),
      tags: [],
      creatorId: 目前身份.id,
      createdAt: new Date().toISOString(),
    }
    新增活動(新活動)
    navigate('/wall', { replace: true })
  }

  return (
    <div className="min-h-svh bg-cork">
      <div className="sticky top-0 z-30 flex items-center gap-3 bg-cork/95 backdrop-blur-sm px-4 py-3">
        <button onClick={() => navigate(-1)} aria-label="返回" className="p-2 -ml-1 rounded-full cursor-pointer hover:bg-black/5 transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">{是編輯模式 ? '編輯活動' : '發起約騎'}</h1>
        <div className="ml-auto flex gap-1">
          {/* 套用範本 */}
          <button onClick={() => set顯示範本(!顯示範本)} aria-label="範本"
            className={`p-2 rounded-full cursor-pointer hover:bg-black/5 transition-colors ${顯示範本 ? 'text-strava' : 'text-gray-600'}`}>
            <Bookmark size={20} />
          </button>
          {/* 儲存為範本 */}
          <button onClick={() => set顯示儲存(!顯示儲存)} aria-label="儲存範本"
            className="p-2 rounded-full cursor-pointer hover:bg-black/5 transition-colors text-gray-600">
            <BookmarkPlus size={20} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-4">

        {/* 範本選擇器（共用範本） */}
        {顯示範本 && (
          <div className="rounded-xl bg-white p-4 shadow-sm space-y-3 border-2 border-strava/20">
            <h3 className="text-sm font-bold text-gray-700">從範本建立</h3>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-400 shrink-0" />
              <select name="tpl-county" value={範本縣市} onChange={e => set範本縣市(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-strava focus:outline-none focus:ring-2 focus:ring-strava/20">
                <option value="">全部縣市</option>
                {縣市列表.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {載入中 ? (
              <p className="text-sm text-gray-500 py-2 text-center">載入中…</p>
            ) : 篩選後範本.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">尚無範本，填寫表單後可點右上角儲存</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {篩選後範本.map(t => (
                  <div key={t.id} className="flex items-center gap-2">
                    <button
                      onClick={() => 套用範本(t)}
                      className="flex-1 text-left rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-strava/5 hover:border-strava/30 transition-colors"
                    >
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {t.routeName} · {查找縣市(t.countyId)?.name ?? ''} · {t.time}
                      </p>
                      {t.creatorName && (
                        <p className="text-xs text-gray-400 mt-0.5">by {t.creatorName}</p>
                      )}
                    </button>
                    {t.creatorId === 使用者.id && (
                      <button onClick={() => 刪除範本(t.id)} aria-label="刪除範本"
                        className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 儲存為範本 */}
        {顯示儲存 && (
          <div className="rounded-xl bg-white p-4 shadow-sm space-y-3 border-2 border-strava/20">
            <h3 className="text-sm font-bold text-gray-700">儲存為範本</h3>
            <Input
              label="範本名稱"
              value={儲存範本名}
              onChange={e => set儲存範本名(e.target.value)}
              placeholder="例：週六鳥嘴潭晨騎…"
              maxLength={30}
            />
            <Button size="sm" onClick={儲存為範本} disabled={!儲存範本名.trim()}>
              <BookmarkPlus size={14} /> 儲存
            </Button>
          </div>
        )}

        {/* ① 日期與時間 */}
        <區塊 title="日期與時間">
          <div className="grid grid-cols-2 gap-3">
            <Input label="約騎日期 *" type="date" value={date} onChange={e => setDate(e.target.value)} min={今天} />
            <Input label="集合時間" type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
        </區塊>

        {/* ② 發起人 */}
        <區塊 title="發起人">
          <div className="flex items-center gap-3">
            <Avatar emoji={目前身份.avatar} size="md" />
            <input value={發起人名稱} onChange={e => set發起人名稱(e.target.value)} maxLength={30}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base bg-white focus:border-strava focus:outline-none focus:ring-2 focus:ring-strava/20" />
          </div>
          {目前身份.id.startsWith('page-') && (
            <p className="text-xs text-strava mt-1">以粉絲頁「{目前身份.name}」身份發起</p>
          )}
        </區塊>

        {/* 封面圖片 */}
        <區塊 title="封面圖片（選填）">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={處理圖片上傳} className="hidden" />
          {coverImage ? (
            <div className="relative w-40 h-40 mx-auto">
              <img src={coverImage} alt="封面預覽" className="w-full h-full rounded-lg object-cover" />
              <button onClick={() => setCoverImage('')} aria-label="移除圖片"
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white cursor-pointer hover:bg-black/70 transition-colors">
                <X size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 py-8 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 cursor-pointer hover:border-strava hover:text-strava transition-colors">
              <ImagePlus size={28} />
              <span className="text-sm">點擊上傳路線圖、活動海報…</span>
            </button>
          )}
        </區塊>

        {/* ③ 集合地點 */}
        <區塊 title="集合地點">
          <Input label="地點名稱" value={spotName} onChange={e => 處理集合點(e.target.value, spotUrl)}
            placeholder="例：7-11 樹王門市、VELOSTUDIO…" />
          <div className="mt-3">
            <Input label="Google Maps 連結" value={spotUrl} onChange={e => 處理集合點(spotName, e.target.value)}
              placeholder="貼上 Google Maps 分享連結…" />
            {spotUrl && (
              <a href={spotUrl} target="_blank" rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-strava cursor-pointer hover:underline">
                <ExternalLink size={12} /> 在 Google Maps 開啟
              </a>
            )}
          </div>
          <div className="mt-3 flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><MapPin size={14} /> 縣市</label>
            <select name="county" value={countyId} onChange={e => setCountyId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-base bg-white focus:border-strava focus:outline-none focus:ring-2 focus:ring-strava/20">
              <option value="">自動帶入或手動選擇</option>
              {縣市列表.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </區塊>

        {/* ④ 路線 */}
        <區塊 title="路線">
          <Input label="路線名稱 *" value={routeName} onChange={e => 處理路線名稱(e.target.value)}
            placeholder="例：埔里虎頭山、鳥嘴潭繞繞…" maxLength={50} />
          <div className="mt-3">
            <label className="text-sm font-medium text-gray-700 block mb-1">路線描述</label>
            <textarea value={routeDetail} onChange={e => setRouteDetail(e.target.value)}
              placeholder="例：樹王 7-11 → 中投公路 → 草屯 → 鳥嘴潭 BCD×4 圈…" rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-strava focus:outline-none focus:ring-2 focus:ring-strava/20 placeholder:text-gray-400" />
          </div>
          <div className="mt-3">
            <Input label="路線連結（Strava / Garmin / 其他）" value={routeUrl} onChange={e => setRouteUrl(e.target.value)}
              placeholder="貼上路線分享連結…" />
            {routeUrl && (
              <a href={routeUrl} target="_blank" rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-strava cursor-pointer hover:underline">
                <Link size={12} /> 開啟路線
              </a>
            )}
          </div>
        </區塊>

        {/* 騎乘資訊 */}
        <區塊 title="騎乘資訊">
          <div className="grid grid-cols-2 gap-3">
            <Input label="距離 (km)" type="number" min="0" value={distance || ''} onChange={e => setDistance(Math.max(0, Number(e.target.value)))} placeholder="例：55…" />
            <Input label="爬升 (m)" type="number" min="0" value={elevation || ''} onChange={e => setElevation(Math.max(0, Number(e.target.value)))} placeholder="例：400…" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Input label="配速 / 難度" value={pace} onChange={e => setPace(e.target.value)} placeholder="例：Z2 穩定…" />
            <Input label="人數上限" type="number" min="0" value={maxParticipants || ''} onChange={e => setMaxParticipants(Math.max(0, Number(e.target.value)))} placeholder="不限制" />
          </div>
        </區塊>

        <區塊 title="注意事項 / 備註">
          <textarea
            value={notes}
            onChange={e => { setNotes(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            onFocus={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            placeholder="Enter 斷行，支援 Markdown 格式（**粗體**、*斜體*、- 列表）&#10;請勿輸入網址連結…"
            rows={5}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white resize-none overflow-hidden focus:border-strava focus:outline-none focus:ring-2 focus:ring-strava/20 placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">支援 Markdown（**粗體**、- 列表），不可輸入網址</p>
        </區塊>

        {/* 發布 */}
        <Button fullWidth size="lg" onClick={提交} disabled={!可提交}>
          {是編輯模式 ? <><Save size={20} /> 儲存變更</> : <><Bike size={20} /> 發布約騎！</>}
        </Button>
      </div>
    </div>
  )
}

function 區塊({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
      <h3 className="text-sm font-bold text-gray-700">{title}</h3>
      {children}
    </div>
  )
}

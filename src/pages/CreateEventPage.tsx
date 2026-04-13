// 發起約騎頁面 — 支援範本快速填入與儲存

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Bike, MapPin, Link, BookmarkPlus, Bookmark, Trash2, Save, MapPinPlus, Pencil, Check, Route, StickyNote, Map, X, Repeat } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useEventStore, 活動已過期, 取得便利貼顏色 } from '../stores/eventStore'
import { useTemplateStore } from '../stores/templateStore'
import { useSpotTemplateStore } from '../stores/spotTemplateStore'
import { useRouteInfoTemplateStore } from '../stores/routeInfoTemplateStore'
import { useNotesTemplateStore } from '../stores/notesTemplateStore'
import { 查找縣市, 縣市列表 } from '../data/counties'
import { 產生ID } from '../utils/formatters'
import type { CyclingEvent, RideTemplate, SavedRoute } from '../types'
import { 淨化純文字, 淨化輸入文字, 安全URL } from '../utils/sanitize'
import { 產生定期日期, 取得星期顯示 } from '../utils/recurrenceUtils'
import { 取得活動上限, 計算進行中活動數 } from '../utils/roleService'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Avatar from '../components/ui/Avatar'
import RoutePickerModal from '../components/route/RoutePickerModal'

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

function 解析集合點範本名稱(rawName: string): { topic: string; placeName: string } {
  const [topic, ...rest] = rawName.split('｜')
  if (rest.length === 0) {
    return { topic: '', placeName: rawName }
  }
  return { topic: topic.trim(), placeName: rest.join('｜').trim() }
}

function 組合集合點範本名稱(topic: string, placeName: string): string {
  const 安全主題 = topic.trim()
  const 安全地點 = placeName.trim()
  return 安全主題 ? `${安全主題}｜${安全地點}` : 安全地點
}

export default function CreateEventPage() {
  const navigate = useNavigate()
  const { id: editId } = useParams()
  const 使用者 = useAuthStore(s => s.使用者)
  const 取得目前發文身份 = useAuthStore(s => s.取得目前發文身份)
  const 目前身份 = 取得目前發文身份()
  const { 活動列表, 新增活動, 更新活動, 批次新增活動 } = useEventStore()
  const { 範本列表, 載入中, 載入範本, 新增範本, 刪除範本 } = useTemplateStore()
  const { 集合點範本列表, 載入中: 集合點載入中, 載入集合點範本, 新增集合點範本, 更新集合點範本, 刪除集合點範本 } = useSpotTemplateStore()
  const { 路線範本列表, 載入中: 路線範本載入中, 載入路線範本, 新增路線範本, 更新路線範本, 刪除路線範本 } = useRouteInfoTemplateStore()
  const { 備註範本列表, 載入中: 備註範本載入中, 載入備註範本, 新增備註範本, 更新備註範本, 刪除備註範本 } = useNotesTemplateStore()

  // 載入所有範本
  useEffect(() => { 載入範本(); 載入集合點範本(); 載入路線範本(); 載入備註範本() }, [載入範本, 載入集合點範本, 載入路線範本, 載入備註範本])

  // 活動額度檢查
  const [額度上限, set額度上限] = useState<number | null>(null)
  const [進行中數量, set進行中數量] = useState<number>(0)
  const [額度檢查中, set額度檢查中] = useState(true)

  useEffect(() => {
    if (!使用者) return
    const authUser = 使用者
    async function 檢查額度() {
      const 角色 = authUser.role ?? 'unverified'
      const [上限, 數量] = await Promise.all([
        取得活動上限(角色),
        計算進行中活動數(authUser.id, (authUser.managedPages ?? []).map(p => p.pageId)),
      ])
      set額度上限(上限)
      set進行中數量(數量)
      set額度檢查中(false)
    }
    檢查額度()
  }, [使用者])

  const 已達上限 = 額度上限 !== null && 進行中數量 >= 額度上限

  // 編輯模式：從 URL 取得既有活動
  const 編輯中活動 = editId ? 活動列表.find(e => e.id === editId) : undefined
  const 是編輯模式 = !!編輯中活動
  const 編輯活動已過期 = 編輯中活動 ? 活動已過期(編輯中活動) : false

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
  const [routeName, setRouteName] = useState(編輯中活動?.title ?? '')
  const [routeDetail, setRouteDetail] = useState(編輯中活動 ? 解析路線描述(編輯中活動.description) : '')
  const [routeUrl, setRouteUrl] = useState(編輯中活動?.stravaRouteUrl ?? '')
  const [spotName, setSpotName] = useState(編輯中活動?.meetingPoint ?? '')
  const [spotUrl, setSpotUrl] = useState(編輯中活動?.meetingPointUrl ?? '')
  const [countyId, setCountyId] = useState(編輯中活動?.countyId ?? 使用者?.countyId ?? '')
  const 使用者圖章 = 使用者?.stampImages ?? (使用者?.stampImage ? [使用者.stampImage] : [])
  // 編輯模式：若活動圖章是 Supabase URL（非 base64），加入選項以便正確比對
  const 編輯中圖章 = 編輯中活動?.coverImage && !使用者圖章.includes(編輯中活動.coverImage) ? [編輯中活動.coverImage] : []
  const 所有圖章 = [...編輯中圖章, ...使用者圖章]
  const [選中圖章, set選中圖章] = useState(編輯中活動?.coverImage || 使用者圖章[0] || '')
  const [notes, setNotes] = useState(編輯中活動 ? 解析備註文字(編輯中活動.description) : '')
  const [distance, setDistance] = useState(編輯中活動?.distance ?? 0)
  const [elevation, setElevation] = useState(編輯中活動?.elevation ?? 0)
  const [pace, setPace] = useState(編輯中活動?.pace === '自由配速' ? '' : (編輯中活動?.pace ?? ''))
  const [maxParticipants, setMaxParticipants] = useState(編輯中活動?.maxParticipants ?? 0)
  const [抓取路線中, set抓取路線中] = useState(false)
  const [提交錯誤, set提交錯誤] = useState('')
  const 預設配速 = ['', '輕鬆騎', '休閒騎', '中等強度', '進階挑戰', '比賽強度']
  const [自訂配速模式, set自訂配速模式] = useState(!預設配速.includes(pace))

  // 從路線連結抓取距離/爬升
  const 抓取路線資訊 = async (url: string) => {
    const isStrava = /strava\.com\/routes\/\d+/.test(url)
    const isRwgps = /ridewithgps\.com\/routes\/\d+/.test(url)
    if (!isStrava && !isRwgps) return

    set抓取路線中(true)
    try {
      const apiUrl = `/api/route-info?url=${encodeURIComponent(url)}`
      const res = await fetch(apiUrl)
      const info = await res.json() as { distance?: number; elevation?: number; title?: string; error?: string }
      if (info.error) {
        console.warn('[路線抓取] API 錯誤:', info.error)
        return
      }
      if (info.distance) setDistance(info.distance)
      if (info.elevation) setElevation(info.elevation)
      if (info.title && !routeName) setRouteName(info.title)
    } catch (err) {
      console.warn('[路線抓取] 失敗:', err)
    } finally {
      set抓取路線中(false)
    }
  }

  // 路線連結變更時自動抓取
  useEffect(() => {
    抓取路線資訊(routeUrl.trim())
  }, [routeUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  // 範本 UI
  const [顯示範本, set顯示範本] = useState(false)
  const [範本縣市, set範本縣市] = useState('')
  const [儲存範本名, set儲存範本名] = useState('')
  const [顯示儲存, set顯示儲存] = useState(false)
  // 集合點範本 UI
  const [顯示集合點範本, set顯示集合點範本] = useState(false)
  const [選中集合點範本, set選中集合點範本] = useState('')
  const [新集合點主題, set新集合點主題] = useState('')
  const [編輯中集合點, set編輯中集合點] = useState<string | null>(null)
  const [編輯集合點主題, set編輯集合點主題] = useState('')
  const [編輯集合點名, set編輯集合點名] = useState('')
  const [編輯集合點URL, set編輯集合點URL] = useState('')
  const [編輯集合點縣市, set編輯集合點縣市] = useState('')
  // 路線庫 Modal
  const [顯示路線庫, set顯示路線庫] = useState(false)
  const [已套用路線庫路線名, set已套用路線庫路線名] = useState('')
  const [已套用路線庫座標, set已套用路線庫座標] = useState<[number, number][]>([])

  const 套用路線庫路線 = (route: SavedRoute) => {
    if (route.distance) setDistance(route.distance)
    if (route.elevation) setElevation(route.elevation)
    if (route.countyId) setCountyId(route.countyId)
    set已套用路線庫路線名(route.name)
    set已套用路線庫座標(route.coordinates ?? [])
  }

  const 清除路線庫套用 = () => {
    set已套用路線庫路線名('')
    set已套用路線庫座標([])
  }

  // 路線範本 UI
  const [顯示路線範本, set顯示路線範本] = useState(false)
  const [選中路線範本, set選中路線範本] = useState('')
  const [編輯中路線, set編輯中路線] = useState<string | null>(null)
  const [編輯路線名, set編輯路線名] = useState('')
  const [編輯路線描述, set編輯路線描述] = useState('')
  const [編輯路線URL, set編輯路線URL] = useState('')
  const [編輯路線距離, set編輯路線距離] = useState(0)
  const [編輯路線爬升, set編輯路線爬升] = useState(0)
  const [編輯路線配速, set編輯路線配速] = useState('')
  const [編輯路線人數, set編輯路線人數] = useState(0)
  // 備註範本 UI
  const [顯示備註範本, set顯示備註範本] = useState(false)
  const [選中備註範本, set選中備註範本] = useState('')
  const [新備註主題, set新備註主題] = useState('')
  const [編輯中備註, set編輯中備註] = useState<string | null>(null)
  const [編輯備註名, set編輯備註名] = useState('')
  const [編輯備註內容, set編輯備註內容] = useState('')
  const 篩選後範本 = 範本列表.filter(t => !範本縣市 || t.countyId === 範本縣市)

  // 定期約騎
  const [定期模式, set定期模式] = useState(false)
  const [定期頻率, set定期頻率] = useState<'weekly' | 'monthly'>('weekly')
  const [定期期數, set定期期數] = useState(4)

  if (!使用者) return null
  const 當前使用者 = 使用者
  const 我的集合點範本列表 = 集合點範本列表.filter(t => t.creatorId === 當前使用者.id)
  const 已選集合點範本 = 我的集合點範本列表.find(t => t.id === 選中集合點範本) ?? null
  const 我的路線範本列表 = 路線範本列表.filter(t => t.creatorId === 當前使用者.id)
  const 已選路線範本 = 我的路線範本列表.find(t => t.id === 選中路線範本) ?? null
  const 我的備註範本列表 = 備註範本列表.filter(t => t.creatorId === 當前使用者.id)
  const 已選備註範本 = 我的備註範本列表.find(t => t.id === 選中備註範本) ?? null

  const 今天 = new Date().toISOString().split('T')[0]
  const 定期達上限 = 定期模式 && 額度上限 !== null && (進行中數量 + 定期期數) > 額度上限
  const 可提交 = routeName.trim() && date && !已達上限 && !額度檢查中 && !定期達上限 && !編輯活動已過期

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
  const 執行範本操作 = async (action: () => Promise<void>) => {
    set提交錯誤('')
    try {
      await action()
    } catch (err) {
      set提交錯誤(err instanceof Error ? err.message : '範本存取失敗，請稍後再試')
    }
  }

  const 儲存為範本 = async () => {
    if (!儲存範本名.trim()) return
    await 執行範本操作(async () => {
      await 新增範本({
        id: `tpl-${Date.now()}`,
        name: 淨化純文字(儲存範本名.trim()),
        routeName: 淨化純文字(routeName),
        routeDetail: 淨化輸入文字(routeDetail),
        routeUrl: 安全URL(routeUrl) ?? '',
        spotName: 淨化純文字(spotName),
        spotUrl: 安全URL(spotUrl) ?? '',
        countyId,
        time,
        distance,
        elevation,
        pace: 淨化純文字(pace),
        maxParticipants,
        notes: notes.split('\n').filter(s => s.trim()).map(s => 淨化輸入文字(s)),
        creatorId: 當前使用者.id,
        creatorName: 當前使用者.name,
      })
      set儲存範本名('')
      set顯示儲存(false)
    })
  }

  // 推斷縣市
  const 處理路線名稱 = (v: string) => {
    setRouteName(v)
    set選中路線範本('')
    if (!countyId) { const r = 從文字推斷縣市(v); if (r) setCountyId(r) }
  }
  const 處理集合點 = (name: string, url: string) => {
    setSpotName(name); setSpotUrl(url)
    set選中集合點範本('')
    if (!countyId) { const r = 從文字推斷縣市(name) || 從文字推斷縣市(url); if (r) setCountyId(r) }
  }

  const 套用集合點範本 = (templateId: string) => {
    set選中集合點範本(templateId)
    if (!templateId) return
    const template = 我的集合點範本列表.find(t => t.id === templateId)
    if (!template) return
    const { placeName } = 解析集合點範本名稱(template.name)
    setSpotName(placeName)
    setSpotUrl(template.url)
    if (template.countyId) {
      setCountyId(template.countyId)
    }
  }

  const 開始編輯集合點範本 = (templateId: string) => {
    const template = 我的集合點範本列表.find(t => t.id === templateId)
    if (!template) return
    const { topic, placeName } = 解析集合點範本名稱(template.name)
    set顯示集合點範本(true)
    set編輯中集合點(template.id)
    set編輯集合點主題(topic)
    set編輯集合點名(placeName)
    set編輯集合點URL(template.url)
    set編輯集合點縣市(template.countyId)
  }

  const 套用路線範本 = (templateId: string) => {
    set選中路線範本(templateId)
    if (!templateId) return
    const template = 我的路線範本列表.find(t => t.id === templateId)
    if (!template) return
    setRouteName(template.routeName)
    setRouteDetail(template.routeDetail)
    setRouteUrl(template.routeUrl)
    setDistance(template.distance)
    setElevation(template.elevation)
    setPace(template.pace)
    setMaxParticipants(template.maxParticipants)
    set自訂配速模式(!預設配速.includes(template.pace))
  }

  const 開始編輯路線範本 = (templateId: string) => {
    const template = 我的路線範本列表.find(t => t.id === templateId)
    if (!template) return
    set顯示路線範本(true)
    set編輯中路線(template.id)
    set編輯路線名(template.routeName)
    set編輯路線描述(template.routeDetail)
    set編輯路線URL(template.routeUrl)
    set編輯路線距離(template.distance)
    set編輯路線爬升(template.elevation)
    set編輯路線配速(template.pace)
    set編輯路線人數(template.maxParticipants)
  }

  const 套用備註範本 = (templateId: string) => {
    set選中備註範本(templateId)
    if (!templateId) return
    const template = 我的備註範本列表.find(t => t.id === templateId)
    if (!template) return
    setNotes(template.notes)
  }

  const 開始編輯備註範本 = (templateId: string) => {
    const template = 我的備註範本列表.find(t => t.id === templateId)
    if (!template) return
    set顯示備註範本(true)
    set編輯中備註(template.id)
    set編輯備註名(template.name)
    set編輯備註內容(template.notes)
  }

  // 過濾連結（使用共用淨化工具）
  const 過濾連結 = (text: string) => 淨化輸入文字(text)

  const 提交 = async () => {
    if (!可提交) return
    set提交錯誤('')
    const 有效縣市 = countyId || 當前使用者.countyId || 'taipei'
    const 縣市 = 查找縣市(有效縣市)

    // 淨化所有使用者輸入欄位
    const 安全標題 = 淨化純文字(routeName.trim())
    const 安全集合點 = 淨化純文字(spotName.trim())
    const 安全配速 = 淨化純文字(pace) || '自由配速'
    const 安全集合點URL = 安全URL(spotUrl.trim())
    const 安全路線URL = 安全URL(routeUrl.trim())

    const 各段: string[] = []
    if (routeDetail.trim()) 各段.push(`🛣️ 路線：\n${淨化純文字(routeDetail.trim())}`)
    const 安全備註 = 過濾連結(notes.trim())
    if (安全備註) 各段.push(`⚠️ 注意事項：\n${安全備註}`)

    try {
      if (是編輯模式 && editId) {
        await 更新活動(editId, {
          title: 安全標題,
          description: 各段.join('\n\n'),
          countyId: 有效縣市,
          region: 縣市?.region || '北部',
          date, time,
          meetingPoint: 安全集合點,
          meetingPointUrl: 安全集合點URL,
          distance, elevation,
          pace: 安全配速,
          maxParticipants,
          stravaRouteUrl: 安全路線URL,
          routeCoordinates: 已套用路線庫座標.length > 0 ? 已套用路線庫座標 : undefined,
          coverImage: 選中圖章 || undefined,
        })
        navigate(`/event/${editId}`, { replace: true })
        return
      }

      if (定期模式) {
        const seriesId = 產生ID()
        const 日期列表 = 產生定期日期(date, 定期頻率, 定期期數)
        const 批次活動: CyclingEvent[] = 日期列表.map((d, i) => {
          const id = 產生ID()
          return {
            id,
            title: `${安全標題}（第 ${i + 1} 期）`,
            description: 各段.join('\n\n'),
            countyId: 有效縣市,
            region: 縣市?.region || '北部',
            date: d, time,
            meetingPoint: 安全集合點,
            meetingPointUrl: 安全集合點URL,
            distance, elevation,
            pace: 安全配速,
            maxParticipants,
            stravaRouteUrl: 安全路線URL,
            routeCoordinates: 已套用路線庫座標.length > 0 ? 已套用路線庫座標 : undefined,
            coverImage: 選中圖章 || undefined,
            stickyColor: 取得便利貼顏色(id),
            tags: [],
            creatorId: 目前身份.id,
            createdAt: new Date().toISOString(),
            seriesId,
            recurrenceType: 定期頻率,
          }
        })
        await 批次新增活動(批次活動)
        navigate('/wall', { replace: true })
        return
      }

      const id = 產生ID()
      const 新活動: CyclingEvent = {
        id,
        title: 安全標題,
        description: 各段.join('\n\n'),
        countyId: 有效縣市,
        region: 縣市?.region || '北部',
        date, time,
        meetingPoint: 安全集合點,
        meetingPointUrl: 安全集合點URL,
        distance, elevation,
        pace: 安全配速,
        maxParticipants,
        stravaRouteUrl: 安全路線URL,
        routeCoordinates: 已套用路線庫座標.length > 0 ? 已套用路線庫座標 : undefined,
        coverImage: 選中圖章 || undefined,
        stickyColor: 取得便利貼顏色(id),
        tags: [],
        creatorId: 目前身份.id,
        createdAt: new Date().toISOString(),
      }
      await 新增活動(新活動)
      navigate('/wall', { replace: true })
    } catch (err) {
      set提交錯誤(err instanceof Error ? err.message : '存檔失敗，請稍後再試')
    }
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

        {/* 活動額度警告 */}
        {!是編輯模式 && !額度檢查中 && 已達上限 && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            <p className="font-bold mb-1">已達活動上限</p>
            <p>你目前有 {進行中數量} 個進行中的活動，已達角色上限（{額度上限}）。請等待既有活動結束後再發起新約騎。</p>
          </div>
        )}

        {提交錯誤 && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            <p className="font-bold mb-1">存檔失敗</p>
            <p>{提交錯誤}</p>
          </div>
        )}

        {/* 範本選擇器（共用範本） */}
        {顯示範本 && (
          <div className="rounded-xl bg-white p-4 shadow-sm space-y-3 border-2 border-strava/20">
            <h3 className="text-sm font-bold text-gray-700">從範本建立</h3>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-400 shrink-0" />
              <select name="tpl-county" value={範本縣市} onChange={e => set範本縣市(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white cursor-pointer focus:border-strava focus:outline-none focus:ring-2 focus:ring-strava/20 focus-visible:ring-2 focus-visible:ring-strava/40">
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
                    {t.creatorId === 當前使用者.id && (
                      <button onClick={() => { void 執行範本操作(() => 刪除範本(t.id)) }} aria-label="刪除範本"
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

        {是編輯模式 && 編輯活動已過期 && (
          <div className="rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-700">
            這個約騎已過期，不能修改。
          </div>
        )}

        {/* ① 日期與時間 */}
        <區塊 title="日期與時間">
          <div className="grid grid-cols-2 gap-3">
            <Input name="ride-date" label="約騎日期 *" type="date" value={date} onChange={e => setDate(e.target.value)} min={今天} />
            <Input name="ride-time" label="集合時間" type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
        </區塊>

        {/* ① 定期約騎（僅新增模式） */}
        {!是編輯模式 && (
          <區塊 title="定期約騎">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={定期模式}
                onChange={e => set定期模式(e.target.checked)}
                className="w-4 h-4 accent-strava cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700">啟用定期約騎</span>
            </label>

            {定期模式 && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">頻率</label>
                    <select
                      name="recurrence-type"
                      value={定期頻率}
                      onChange={e => set定期頻率(e.target.value as 'weekly' | 'monthly')}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-strava/30 cursor-pointer"
                    >
                      <option value="weekly">每週</option>
                      <option value="monthly">每月</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">期數</label>
                    <select
                      name="recurrence-count"
                      value={定期期數}
                      onChange={e => set定期期數(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-strava/30 cursor-pointer"
                    >
                      {Array.from({ length: 11 }, (_, i) => i + 2).map(n => (
                        <option key={n} value={n}>{n} 期</option>
                      ))}
                    </select>
                  </div>
                </div>

                {date && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">預覽日期</p>
                    <ul className="space-y-1">
                      {產生定期日期(date, 定期頻率, 定期期數).map((d, i) => (
                        <li key={d} className="flex items-center gap-1.5 text-sm">
                          <span className="text-gray-400 w-14 shrink-0">第 {i + 1} 期</span>
                          <span className="text-gray-700">{d}</span>
                          <span className="text-gray-400">{取得星期顯示(d)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {定期達上限 && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <Repeat size={12} />
                    定期 {定期期數} 期超過活動配額上限（目前進行中 {進行中數量} 筆，上限 {額度上限} 筆）
                  </p>
                )}
              </div>
            )}
          </區塊>
        )}

        {/* ② 發起人 + 活動圖章（左右排列，不可編輯） */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-white p-4 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-gray-700">發起人</h3>
            <div className="flex items-center gap-3">
              <Avatar emoji={目前身份.avatar} size="md" />
              <span className="text-base text-gray-800">{目前身份.name}</span>
            </div>
            {目前身份.id.startsWith('page-') && (
              <p className="text-xs text-strava">以粉絲頁身份發起</p>
            )}
          </div>
          {所有圖章.length > 0 && (
            <div className="rounded-xl bg-white p-4 shadow-sm flex flex-col gap-2">
              <h3 className="text-sm font-bold text-gray-700">活動圖章</h3>
              <div className="flex gap-2">
                {所有圖章.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => set選中圖章(選中圖章 === img ? '' : img)}
                    className={`w-16 h-16 rounded-lg overflow-hidden cursor-pointer transition-all ${
                      選中圖章 === img ? 'ring-2 ring-strava ring-offset-1' : 'border border-gray-200 opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img src={img} alt={`圖章 ${i + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
              {!選中圖章 && <p className="text-xs text-gray-400">點擊選擇要使用的圖章</p>}
            </div>
          )}
        </div>

        {/* ③ 集合地點 */}
        <div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">集合地點</h3>
            <div className="flex items-center gap-1">
              {已選集合點範本 && (
                <button
                  type="button"
                  onClick={() => 開始編輯集合點範本(已選集合點範本.id)}
                  aria-label="編輯已選集合點"
                  className="p-1.5 rounded-full text-gray-500 cursor-pointer hover:text-strava hover:bg-black/5 transition-colors"
                >
                  <Pencil size={16} />
                </button>
              )}
              <button onClick={() => set顯示集合點範本(!顯示集合點範本)} aria-label="集合點範本"
                className={`p-1.5 rounded-full cursor-pointer hover:bg-black/5 transition-colors ${顯示集合點範本 ? 'text-strava' : 'text-gray-500'}`}>
                <MapPinPlus size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">已儲存地點</label>
            <select
              name="spot-template-select"
              value={選中集合點範本}
              onChange={e => 套用集合點範本(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-base bg-white cursor-pointer focus:border-strava focus:outline-none focus:ring-2 focus:ring-strava/20 focus-visible:ring-2 focus-visible:ring-strava/40"
            >
              <option value="">手動輸入或選擇已儲存地點</option>
              {我的集合點範本列表.map(t => {
                const { topic, placeName } = 解析集合點範本名稱(t.name)
                return (
                  <option key={t.id} value={t.id}>
                    {topic || placeName}{topic && placeName ? `｜${placeName}` : ''}{t.countyId ? `｜${查找縣市(t.countyId)?.name ?? ''}` : ''}
                  </option>
                )
              })}
            </select>
          </div>

          {/* 集合點範本面板 */}
          {顯示集合點範本 && (
            <div className="rounded-lg bg-gray-50 p-3 space-y-2 border border-gray-200">
              {集合點載入中 ? (
                <p className="text-sm text-gray-500 py-2 text-center">載入中…</p>
              ) : 我的集合點範本列表.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">尚無集合點範本，填寫集合地點後可儲存</p>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {我的集合點範本列表.map(t => (
                    <div key={t.id}>
                      {編輯中集合點 === t.id ? (
                        /* 編輯模式 */
                        <div className="rounded-lg border border-strava/30 bg-white p-2.5 space-y-2">
                          <input name="edit-spot-topic" autoComplete="off" value={編輯集合點主題} onChange={e => set編輯集合點主題(e.target.value)}
                            placeholder="主題（例：台中晨騎、北屯團練）…" maxLength={30}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-strava focus:outline-none focus-visible:ring-2 focus-visible:ring-strava/40" />
                          <input name="edit-spot-name" autoComplete="off" value={編輯集合點名} onChange={e => set編輯集合點名(e.target.value)}
                            placeholder="地點名稱…" maxLength={50}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-strava focus:outline-none focus-visible:ring-2 focus-visible:ring-strava/40" />
                          <input name="edit-spot-url" autoComplete="url" value={編輯集合點URL} onChange={e => set編輯集合點URL(e.target.value)}
                            placeholder="Google Maps 連結…"
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-strava focus:outline-none focus-visible:ring-2 focus-visible:ring-strava/40" />
                          <select name="edit-spot-county" value={編輯集合點縣市} onChange={e => set編輯集合點縣市(e.target.value)}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white cursor-pointer focus:border-strava focus:outline-none focus-visible:ring-2 focus-visible:ring-strava/40">
                            <option value="">選擇縣市</option>
                            {縣市列表.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <div className="flex gap-2">
                          <button onClick={() => {
                            void 執行範本操作(async () => {
                              await 更新集合點範本({
                                  ...t,
                                  name: 組合集合點範本名稱(編輯集合點主題, 編輯集合點名),
                                  url: 編輯集合點URL,
                                  countyId: 編輯集合點縣市,
                                })
                                if (選中集合點範本 === t.id) {
                                  setSpotName(編輯集合點名)
                                  setSpotUrl(編輯集合點URL)
                                  if (編輯集合點縣市) {
                                    setCountyId(編輯集合點縣市)
                                  }
                                }
                                set編輯集合點主題('')
                                set編輯中集合點(null)
                              })
                            }} aria-label="確認編輯"
                              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-white bg-strava cursor-pointer hover:bg-strava/90 transition-colors">
                              <Check size={14} /> 確認
                            </button>
                            <button onClick={() => set編輯中集合點(null)}
                              className="px-2.5 py-1 rounded text-xs text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors">
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* 顯示模式 */
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              套用集合點範本(t.id)
                              set顯示集合點範本(false)
                            }}
                            className="flex-1 text-left rounded-lg border border-gray-200 px-3 py-2 cursor-pointer hover:bg-strava/5 hover:border-strava/30 transition-colors"
                          >
                            {(() => {
                              const { topic, placeName } = 解析集合點範本名稱(t.name)
                              return (
                                <>
                                  <p className="text-sm font-medium">{topic || placeName}</p>
                                  {topic && <p className="text-xs text-gray-500 mt-0.5 truncate">{placeName}</p>}
                                </>
                              )
                            })()}
                            {(t.countyId || t.url) && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {查找縣市(t.countyId)?.name ?? ''}{t.countyId && t.url ? ' · ' : ''}{t.url ? '有地圖連結' : ''}
                              </p>
                            )}
                          </button>
                          <button onClick={() => 開始編輯集合點範本(t.id)} aria-label="編輯集合點"
                            className="p-1.5 rounded-full text-gray-400 hover:text-strava hover:bg-strava/10 cursor-pointer transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => {
                            void 執行範本操作(async () => {
                              await 刪除集合點範本(t.id)
                              if (選中集合點範本 === t.id) {
                                set選中集合點範本('')
                              }
                            })
                          }} aria-label="刪除集合點"
                            className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* 儲存目前集合點 */}
              {spotName.trim() && (
                <div className="space-y-2">
                  <input
                    name="new-spot-topic"
                    autoComplete="off"
                    value={新集合點主題}
                    onChange={e => set新集合點主題(e.target.value)}
                    placeholder="主題（例：台中早鳥集合點）…"
                    maxLength={30}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-strava focus:outline-none focus-visible:ring-2 focus-visible:ring-strava/40"
                  />
                  <button
                    onClick={() => {
                      void 執行範本操作(async () => {
                        await 新增集合點範本({
                          id: `spot-${Date.now()}`,
                          name: 組合集合點範本名稱(淨化純文字(新集合點主題), 淨化純文字(spotName.trim())),
                          url: 安全URL(spotUrl.trim()) ?? '',
                          countyId,
                          creatorId: 當前使用者.id,
                        })
                        set新集合點主題('')
                      })
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 cursor-pointer hover:border-strava hover:text-strava transition-colors"
                  >
                    <MapPinPlus size={14} /> 儲存目前集合點為範本
                  </button>
                </div>
              )}
            </div>
          )}

          <Input name="spot-name" autoComplete="off" label="地點名稱" value={spotName} onChange={e => 處理集合點(e.target.value, spotUrl)}
            placeholder="例：7-11 樹王門市、VELOSTUDIO…" />
          <div className="mt-3">
            <Input name="spot-url" autoComplete="url" label="Google Maps 連結" value={spotUrl} onChange={e => 處理集合點(spotName, e.target.value)}
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
              className="rounded-lg border border-gray-300 px-3 py-2 text-base bg-white cursor-pointer focus:border-strava focus:outline-none focus:ring-2 focus:ring-strava/20 focus-visible:ring-2 focus-visible:ring-strava/40">
              <option value="">自動帶入或手動選擇</option>
              {縣市列表.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* ④ 路線與騎乘資訊 */}
        <div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">路線與騎乘資訊</h3>
            <div className="flex items-center gap-1">
              {已選路線範本 && (
                <button
                  type="button"
                  onClick={() => 開始編輯路線範本(已選路線範本.id)}
                  aria-label="編輯已選路線範本"
                  className="p-1.5 rounded-full text-gray-500 cursor-pointer hover:text-strava hover:bg-black/5 transition-colors"
                >
                  <Pencil size={16} />
                </button>
              )}
              <button onClick={() => set顯示路線範本(!顯示路線範本)} aria-label="路線範本"
                className={`p-1.5 rounded-full cursor-pointer hover:bg-black/5 transition-colors ${顯示路線範本 ? 'text-strava' : 'text-gray-500'}`}>
                <Route size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">已儲存路線</label>
            <select
              name="route-template-select"
              value={選中路線範本}
              onChange={e => 套用路線範本(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-base bg-white cursor-pointer focus:border-strava focus:outline-none focus:ring-2 focus:ring-strava/20 focus-visible:ring-2 focus-visible:ring-strava/40"
            >
              <option value="">手動輸入或選擇已儲存路線</option>
              {我的路線範本列表.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name || t.routeName}{t.distance ? `｜${t.distance}km` : ''}{t.elevation ? `｜${t.elevation}m` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 路線範本面板 */}
          {顯示路線範本 && (
            <div className="rounded-lg bg-gray-50 p-3 space-y-2 border border-gray-200">
              {路線範本載入中 ? (
                <p className="text-sm text-gray-500 py-2 text-center">載入中…</p>
              ) : 我的路線範本列表.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">尚無路線範本，填寫路線資訊後可儲存</p>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {我的路線範本列表.map(t => (
                    <div key={t.id}>
                      {編輯中路線 === t.id ? (
                        /* 編輯模式 */
                        <div className="rounded-lg border border-strava/30 bg-white p-2.5 space-y-2">
                          <input name="edit-route-name" autoComplete="off" value={編輯路線名} onChange={e => set編輯路線名(e.target.value)}
                            placeholder="路線名稱…" maxLength={50}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-strava focus:outline-none focus-visible:ring-2 focus-visible:ring-strava/40" />
                          <textarea name="edit-route-description" value={編輯路線描述} onChange={e => set編輯路線描述(e.target.value)}
                            placeholder="路線描述…" rows={3}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-strava focus:outline-none focus-visible:ring-2 focus-visible:ring-strava/40" />
                          <input name="edit-route-url" autoComplete="url" value={編輯路線URL} onChange={e => set編輯路線URL(e.target.value)}
                            placeholder="路線連結…"
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-strava focus:outline-none focus-visible:ring-2 focus-visible:ring-strava/40" />
                          <div className="grid grid-cols-2 gap-2">
                            <input name="edit-route-distance" type="number" value={編輯路線距離 || ''} onChange={e => set編輯路線距離(Math.max(0, Number(e.target.value)))}
                              placeholder="距離 km" min="0"
                              className="rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-strava focus:outline-none focus-visible:ring-2 focus-visible:ring-strava/40" />
                            <input name="edit-route-elevation" type="number" value={編輯路線爬升 || ''} onChange={e => set編輯路線爬升(Math.max(0, Number(e.target.value)))}
                              placeholder="爬升 m" min="0"
                              className="rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-strava focus:outline-none focus-visible:ring-2 focus-visible:ring-strava/40" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input name="edit-route-pace" autoComplete="off" value={編輯路線配速} onChange={e => set編輯路線配速(e.target.value)}
                              placeholder="配速/難度"
                              className="rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-strava focus:outline-none focus-visible:ring-2 focus-visible:ring-strava/40" />
                            <input name="edit-route-max-participants" type="number" value={編輯路線人數 || ''} onChange={e => set編輯路線人數(Math.max(0, Number(e.target.value)))}
                              placeholder="人數上限" min="0"
                              className="rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-strava focus:outline-none focus-visible:ring-2 focus-visible:ring-strava/40" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => {
                              void 執行範本操作(async () => {
                                await 更新路線範本({ ...t, routeName: 編輯路線名, routeDetail: 編輯路線描述, routeUrl: 編輯路線URL, distance: 編輯路線距離, elevation: 編輯路線爬升, pace: 編輯路線配速, maxParticipants: 編輯路線人數 })
                                if (選中路線範本 === t.id) {
                                  setRouteName(編輯路線名)
                                  setRouteDetail(編輯路線描述)
                                  setRouteUrl(編輯路線URL)
                                  setDistance(編輯路線距離)
                                  setElevation(編輯路線爬升)
                                  setPace(編輯路線配速)
                                  setMaxParticipants(編輯路線人數)
                                  set自訂配速模式(!預設配速.includes(編輯路線配速))
                                }
                                set編輯中路線(null)
                              })
                            }} aria-label="確認編輯"
                              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-white bg-strava cursor-pointer hover:bg-strava/90 transition-colors">
                              <Check size={14} /> 確認
                            </button>
                            <button onClick={() => set編輯中路線(null)}
                              className="px-2.5 py-1 rounded text-xs text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors">
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* 顯示模式 */
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              套用路線範本(t.id)
                              set顯示路線範本(false)
                            }}
                            className="flex-1 text-left rounded-lg border border-gray-200 px-3 py-2 cursor-pointer hover:bg-strava/5 hover:border-strava/30 transition-colors"
                          >
                            <p className="text-sm font-medium">{t.name || t.routeName}</p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {t.routeName}{t.distance ? ` · ${t.distance}km` : ''}{t.elevation ? ` · ${t.elevation}m` : ''}
                            </p>
                          </button>
                          <button onClick={() => 開始編輯路線範本(t.id)} aria-label="編輯路線範本"
                            className="p-1.5 rounded-full text-gray-400 hover:text-strava hover:bg-strava/10 cursor-pointer transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => {
                            void 執行範本操作(async () => {
                              await 刪除路線範本(t.id)
                              if (選中路線範本 === t.id) {
                                set選中路線範本('')
                              }
                            })
                          }} aria-label="刪除路線範本"
                            className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* 儲存目前路線 */}
              {routeName.trim() && (
                <button
                  onClick={() => {
                    void 執行範本操作(() => 新增路線範本({
                      id: `ri-${Date.now()}`,
                      name: 淨化純文字(routeName.trim()),
                      routeName: 淨化純文字(routeName.trim()),
                      routeDetail: 淨化輸入文字(routeDetail),
                      routeUrl: 安全URL(routeUrl) ?? '',
                      distance,
                      elevation,
                      pace: 淨化純文字(pace),
                      maxParticipants,
                      creatorId: 當前使用者.id,
                    }))
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 cursor-pointer hover:border-strava hover:text-strava transition-colors"
                >
                  <Route size={14} /> 儲存目前路線為範本
                </button>
              )}
            </div>
          )}

          <Input name="route-name" autoComplete="off" label="路線名稱 *" value={routeName} onChange={e => 處理路線名稱(e.target.value)}
            placeholder="例：埔里虎頭山、鳥嘴潭繞繞…" maxLength={50} />
          <div className="mt-3">
            <label className="text-sm font-medium text-gray-700 block mb-1">路線描述</label>
            <textarea name="route-description" value={routeDetail} onChange={e => { setRouteDetail(e.target.value); set選中路線範本('') }}
              placeholder="例：樹王 7-11 → 中投公路 → 草屯 → 鳥嘴潭 BCD×4 圈…" rows={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-strava focus:outline-none focus:ring-2 focus:ring-strava/20 focus-visible:ring-2 focus-visible:ring-strava/40 placeholder:text-gray-400" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              {已套用路線庫路線名 ? (
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-strava px-3 py-2">
                  <Map size={14} className="text-white shrink-0" />
                  <span className="text-sm text-white font-medium flex-1 truncate">{已套用路線庫路線名}</span>
                  <button type="button" onClick={清除路線庫套用} aria-label="取消套用路線"
                    className="text-white/70 hover:text-white cursor-pointer transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { set選中路線範本(''); set顯示路線庫(true) }}
                  className="mb-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 cursor-pointer hover:border-strava hover:text-strava transition-colors"
                >
                  <Map size={14} /> 從路線庫選取
                </button>
              )}
              <Input name="route-url" autoComplete="url" label="路線連結（Strava / Ride with GPS / Garmin）" value={routeUrl} onChange={e => { setRouteUrl(e.target.value); set選中路線範本('') }}
                placeholder="貼上路線分享連結…" disabled={!!已套用路線庫路線名} />
              {!已套用路線庫路線名 && routeUrl && (() => {
                const isStrava = /strava\.com\/routes\/\d+/.test(routeUrl)
                const isRwgps = /ridewithgps\.com\/routes\/\d+/.test(routeUrl)
                const isGarmin = /connect\.garmin\.com/.test(routeUrl)
                return (
                  <div className="mt-1.5 space-y-1">
                    <a href={routeUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-strava cursor-pointer hover:underline">
                      <Link size={12} /> 開啟路線
                    </a>
                    {isStrava && <p className="text-xs text-emerald-600">Strava 路線{抓取路線中 ? ' — 正在抓取…' : ' — 自動填入距離/爬升'}</p>}
                    {isRwgps && <p className="text-xs text-emerald-600">Ride with GPS{抓取路線中 ? ' — 正在抓取…' : ' — 自動填入距離/爬升'}</p>}
                    {isGarmin && <p className="text-xs text-amber-600">Garmin Connect 不支援自動抓取</p>}
                  </div>
                )
              })()}
            </div>
            {/* 右側：平台支援說明 */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-500 space-y-1.5">
              <p className="font-medium text-gray-700">平台支援</p>
              <p className="text-emerald-600">Strava — 地圖嵌入 + 自動抓取</p>
              <p className="text-emerald-600">Ride with GPS — 地圖嵌入 + 自動抓取</p>
              <p className="text-amber-600">Garmin Connect — 僅連結（不支援嵌入）</p>
              <p className="text-gray-400">其他平台待測試，有問題問<a href="https://page.line.me/criterium" target="_blank" rel="noopener noreferrer" className="text-line hover:underline">憲哥</a></p>
            </div>
          </div>
          <hr className="my-3 border-gray-200" />
          {(() => {
            const 有自動抓取 = /strava\.com\/routes\/\d+/.test(routeUrl) || /ridewithgps\.com\/routes\/\d+/.test(routeUrl)
            return 有自動抓取 ? (
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">
                  {抓取路線中 ? '正在抓取路線資訊…' : distance || elevation ? `距離 ${distance} km · 爬升 ${elevation} m（自動抓取）` : '距離與爬升將自動從路線抓取'}
                </p>
                <button
                  type="button"
                  onClick={() => 抓取路線資訊(routeUrl.trim())}
                  disabled={抓取路線中}
                  className="text-xs text-strava hover:text-strava/80 disabled:text-gray-300 cursor-pointer transition-colors"
                >
                  {抓取路線中 ? '抓取中…' : '重新抓取'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Input name="distance" label="距離 (km)" type="number" inputMode="decimal" min="0" value={distance || ''} onChange={e => { setDistance(Math.max(0, Number(e.target.value))); set選中路線範本('') }} placeholder="例：55…" />
                <Input name="elevation" label="爬升 (m)" type="number" inputMode="numeric" min="0" value={elevation || ''} onChange={e => { setElevation(Math.max(0, Number(e.target.value))); set選中路線範本('') }} placeholder="例：400…" />
              </div>
            )
          })()}
          <div className={`${/strava\.com\/routes\/\d+/.test(routeUrl) || /ridewithgps\.com\/routes\/\d+/.test(routeUrl) ? '' : 'mt-3'}`}>
            <label htmlFor="pace-select" className="block text-sm font-medium text-gray-700 mb-1">配速 / 難度</label>
            <select
              id="pace-select"
              name="pace"
              value={自訂配速模式 ? '__custom__' : pace}
              onChange={e => {
                set選中路線範本('')
                if (e.target.value === '__custom__') { set自訂配速模式(true); setPace('') }
                else { set自訂配速模式(false); setPace(e.target.value) }
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white cursor-pointer focus:border-strava focus:outline-none focus:ring-2 focus:ring-strava/20"
            >
              <option value="">自由配速（不限制）</option>
              <option value="輕鬆騎">輕鬆騎 — 邊騎邊聊天，享受風景</option>
              <option value="休閒騎">休閒騎 — 輕鬆節奏，適合所有人</option>
              <option value="中等強度">中等強度 — 穩定配速，有一定體能需求</option>
              <option value="進階挑戰">進階挑戰 — 丘陵爬坡，需要訓練基礎</option>
              <option value="比賽強度">比賽強度 — 高強度騎乘，適合有經驗車手</option>
              <option value="__custom__">其他（自行填寫）</option>
            </select>
            {自訂配速模式 && (
              <input
                name="pace-custom"
                autoComplete="off"
                value={pace}
                onChange={e => { setPace(e.target.value); set選中路線範本('') }}
                placeholder="請輸入配速 / 難度…"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-strava focus:outline-none focus:ring-2 focus:ring-strava/20 placeholder:text-gray-400"
              />
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">注意事項 / 備註</h3>
            <div className="flex items-center gap-1">
              {已選備註範本 && (
                <button
                  type="button"
                  onClick={() => 開始編輯備註範本(已選備註範本.id)}
                  aria-label="編輯已選備註範本"
                  className="p-1.5 rounded-full text-gray-500 cursor-pointer hover:text-strava hover:bg-black/5 transition-colors"
                >
                  <Pencil size={16} />
                </button>
              )}
              <button onClick={() => set顯示備註範本(!顯示備註範本)} aria-label="備註範本"
                className={`p-1.5 rounded-full cursor-pointer hover:bg-black/5 transition-colors ${顯示備註範本 ? 'text-strava' : 'text-gray-500'}`}>
                <StickyNote size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">已儲存備註</label>
            <select
              name="notes-template-select"
              value={選中備註範本}
              onChange={e => 套用備註範本(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-base bg-white cursor-pointer focus:border-strava focus:outline-none focus:ring-2 focus:ring-strava/20 focus-visible:ring-2 focus-visible:ring-strava/40"
            >
              <option value="">手動輸入或選擇已儲存備註</option>
              {我的備註範本列表.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.notes ? `｜${t.notes.slice(0, 18)}${t.notes.length > 18 ? '…' : ''}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 備註範本面板 */}
          {顯示備註範本 && (
            <div className="rounded-lg bg-gray-50 p-3 space-y-2 border border-gray-200">
              {備註範本載入中 ? (
                <p className="text-sm text-gray-500 py-2 text-center">載入中…</p>
              ) : 我的備註範本列表.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">尚無備註範本，填寫備註後可儲存</p>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {我的備註範本列表.map(t => (
                    <div key={t.id}>
                      {編輯中備註 === t.id ? (
                        <div className="rounded-lg border border-strava/30 bg-white p-2.5 space-y-2">
                          <input name="edit-notes-name" autoComplete="off" value={編輯備註名} onChange={e => set編輯備註名(e.target.value)}
                            placeholder="主題…" maxLength={30}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-strava focus:outline-none focus-visible:ring-2 focus-visible:ring-strava/40" />
                          <textarea name="edit-notes-content" value={編輯備註內容} onChange={e => set編輯備註內容(e.target.value)}
                            placeholder="注意事項內容…" rows={4}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-strava focus:outline-none focus-visible:ring-2 focus-visible:ring-strava/40" />
                          <div className="flex gap-2">
                            <button onClick={() => {
                              void 執行範本操作(async () => {
                                await 更新備註範本({ ...t, name: 編輯備註名, notes: 編輯備註內容 })
                                if (選中備註範本 === t.id) {
                                  setNotes(編輯備註內容)
                                }
                                set編輯中備註(null)
                              })
                            }} aria-label="確認編輯"
                              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-white bg-strava cursor-pointer hover:bg-strava/90 transition-colors">
                              <Check size={14} /> 確認
                            </button>
                            <button onClick={() => set編輯中備註(null)}
                              className="px-2.5 py-1 rounded text-xs text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors">
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              套用備註範本(t.id)
                              set顯示備註範本(false)
                            }}
                            className="flex-1 text-left rounded-lg border border-gray-200 px-3 py-2 cursor-pointer hover:bg-strava/5 hover:border-strava/30 transition-colors"
                          >
                            <p className="text-sm font-medium">{t.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.notes}</p>
                          </button>
                          <button onClick={() => 開始編輯備註範本(t.id)} aria-label="編輯備註範本"
                            className="p-1.5 rounded-full text-gray-400 hover:text-strava hover:bg-strava/10 cursor-pointer transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => {
                            void 執行範本操作(async () => {
                              await 刪除備註範本(t.id)
                              if (選中備註範本 === t.id) {
                                set選中備註範本('')
                              }
                            })
                          }} aria-label="刪除備註範本"
                            className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {notes.trim() && (
                <div className="space-y-2">
                  <input
                    name="new-notes-topic"
                    autoComplete="off"
                    value={新備註主題}
                    onChange={e => set新備註主題(e.target.value)}
                    placeholder="主題（例：平安回家、雨天備案）…"
                    maxLength={30}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-strava focus:outline-none focus-visible:ring-2 focus-visible:ring-strava/40"
                  />
                  <button
                    onClick={() => {
                      const 安全備註 = 淨化輸入文字(notes.trim())
                      const 預設名 = 安全備註.slice(0, 20) + (安全備註.length > 20 ? '…' : '')
                      void 執行範本操作(async () => {
                        await 新增備註範本({
                          id: `note-${Date.now()}`,
                          name: 淨化純文字(新備註主題.trim()) || 預設名,
                          notes: 安全備註,
                          creatorId: 當前使用者.id,
                        })
                        set新備註主題('')
                      })
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 cursor-pointer hover:border-strava hover:text-strava transition-colors"
                  >
                    <StickyNote size={14} /> 儲存目前備註為範本
                  </button>
                </div>
              )}
            </div>
          )}

          <textarea
            name="notes"
            value={notes}
            onChange={e => { set選中備註範本(''); setNotes(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            onFocus={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            placeholder="Enter 斷行，支援 Markdown 格式（**粗體**、*斜體*、- 列表）&#10;請勿輸入網址連結…"
            rows={5}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white resize-none overflow-hidden focus:border-strava focus:outline-none focus:ring-2 focus:ring-strava/20 focus-visible:ring-2 focus-visible:ring-strava/40 placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">支援 Markdown（**粗體**、- 列表），不可輸入網址</p>
        </div>

        {/* 發布 */}
        <Button fullWidth size="lg" onClick={提交} disabled={!可提交}>
          {是編輯模式 ? <><Save size={20} /> 儲存變更</> : <><Bike size={20} /> 發布約騎！</>}
        </Button>
      </div>

      <RoutePickerModal
        開啟={顯示路線庫}
        關閉={() => set顯示路線庫(false)}
        onSelect={套用路線庫路線}
      />
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

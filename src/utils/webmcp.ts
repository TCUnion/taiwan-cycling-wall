// WebMCP — 把站點功能透過 navigator.modelContext 暴露給瀏覽器內 AI agent
// https://webmachinelearning.github.io/webmcp/
// 只在支援的瀏覽器執行（Chrome 預期 EPP 期間有 origin trial）

interface ToolInputSchema {
  type: 'object'
  properties: Record<string, unknown>
  required?: string[]
}

interface Tool {
  name: string
  description: string
  inputSchema: ToolInputSchema
  execute: (input: Record<string, unknown>) => Promise<unknown> | unknown
}

interface ModelContext {
  provideContext: (ctx: { tools: Tool[] }) => void | Promise<void>
}

declare global {
  interface Navigator {
    modelContext?: ModelContext
  }
}

export function 註冊WebMCPTools() {
  if (typeof window === 'undefined') return
  const mc = navigator.modelContext
  if (!mc?.provideContext) return

  try {
    void mc.provideContext({
      tools: [
        {
          name: 'list_active_rides',
          description: '列出公布欄上所有進行中的約騎活動（未過期的），可依縣市篩選',
          inputSchema: {
            type: 'object',
            properties: {
              county: { type: 'string', description: '縣市名稱，例如「台中市」、「台北市」' },
            },
          },
          execute: async (input) => {
            const county = (input.county as string | undefined)?.trim()
            const { data, error } = await fetch('https://jxubndwcralkrbunxokf.supabase.co/rest/v1/cycling_events?select=id,title,date,time,county_id,region,meeting_point,distance,elevation,pace&order=date.asc', {
              headers: {
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
              },
            }).then(async r => ({
              data: r.ok ? await r.json() : null,
              error: r.ok ? null : await r.text(),
            }))
            if (error) return { error }
            const list = Array.isArray(data) ? data : []
            const now = Date.now()
            const filtered = list.filter((e: { date?: string; time?: string; county_id?: string }) => {
              const t = new Date(`${e.date ?? ''}T${e.time ?? '00:00'}:00`).getTime()
              if (Number.isNaN(t)) return false
              // 活動 12h 內仍視為進行中
              if (t + 12 * 3600 * 1000 < now) return false
              if (county && e.county_id && !e.county_id.includes(county)) return false
              return true
            })
            return { count: filtered.length, events: filtered }
          },
        },
        {
          name: 'get_route_info',
          description: '從 Strava 或 Ride with GPS 路線連結取得距離（公里）與爬升（公尺）',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'Strava 或 RWGPS 路線網址' },
            },
            required: ['url'],
          },
          execute: async (input) => {
            const u = input.url as string
            if (!u) return { error: 'url 必填' }
            const r = await fetch(`/api/route-info?url=${encodeURIComponent(u)}`)
            if (!r.ok) return { error: `HTTP ${r.status}` }
            return await r.json()
          },
        },
        {
          name: 'check_event_weather',
          description: '查詢特定地點 + 日期的天氣預報（OpenWeatherMap 5 天 / 3 小時）',
          inputSchema: {
            type: 'object',
            properties: {
              lat: { type: 'number', description: '緯度' },
              lon: { type: 'number', description: '經度' },
              date: { type: 'string', description: '日期 YYYY-MM-DD' },
            },
            required: ['lat', 'lon', 'date'],
          },
          execute: async (input) => {
            const r = await fetch('https://service.criterium.tw/webhook/event-weather-check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat: input.lat, lon: input.lon, date: input.date }),
            })
            if (!r.ok) return { error: `HTTP ${r.status}` }
            return await r.json()
          },
        },
      ],
    })
  } catch (e) {
    // 不支援或失敗就靜默
    console.warn('[WebMCP] provideContext 失敗', e)
  }
}

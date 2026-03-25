import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Route, Mountain } from 'lucide-react'
import { useEventStore } from '../stores/eventStore'
import { 查找縣市 } from '../data/counties'
import { 格式化日期, 格式化距離 } from '../utils/formatters'
import Badge from '../components/ui/Badge'

export default function HistoryPage() {
  const navigate = useNavigate()
  const 歷史活動 = useEventStore(s => s.取得歷史活動)()

  return (
    <div className="min-h-svh bg-cork">
      {/* 標題列 */}
      <div className="sticky top-0 z-30 bg-cork/95 backdrop-blur-sm pb-2">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={() => navigate('/wall')} aria-label="返回" className="cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">歷史活動</h1>
          <span className="text-sm text-gray-500 ml-auto">{歷史活動.length} 則</span>
        </div>
      </div>

      {歷史活動.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <p className="text-lg font-medium">目前沒有歷史活動</p>
        </div>
      ) : (
        <div className="px-4 pb-4 space-y-3">
          {歷史活動.map(活動 => {
            const 縣市 = 查找縣市(活動.countyId)
            return (
              <button
                key={活動.id}
                onClick={() => navigate(`/event/${活動.id}`)}
                className="w-full text-left bg-white/70 rounded-lg p-4 shadow-sm hover:bg-white/90 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm mb-1 truncate">{活動.title}</h3>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="shrink-0" />
                        <span>{格式化日期(活動.date)} {活動.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{活動.meetingPoint}（{縣市?.name}）</span>
                      </div>
                      {(活動.distance > 0 || 活動.elevation > 0) && (
                        <div className="flex items-center gap-3">
                          {活動.distance > 0 && (
                            <span className="flex items-center gap-1">
                              <Route size={12} /> {格式化距離(活動.distance)}
                            </span>
                          )}
                          {活動.elevation > 0 && (
                            <span className="flex items-center gap-1">
                              <Mountain size={12} /> {活動.elevation}m
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {/* 參加人數 */}
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      {活動.participants.length} 人參加
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="region" region={活動.region}>{活動.region}</Badge>
                    {活動.coverImage && (
                      <img src={活動.coverImage} alt="" className="w-10 h-10 rounded object-cover" />
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

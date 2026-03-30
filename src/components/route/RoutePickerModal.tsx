import { useEffect } from 'react'
import { Map } from 'lucide-react'
import type { SavedRoute } from '../../types'
import { useAuthStore } from '../../stores/authStore'
import { useRouteStore } from '../../stores/routeStore'
import Modal from '../ui/Modal'
import RouteCard from './RouteCard'

interface Props {
  開啟: boolean
  關閉: () => void
  onSelect: (route: SavedRoute) => void
}

export default function RoutePickerModal({ 開啟, 關閉, onSelect }: Props) {
  const 使用者 = useAuthStore(s => s.使用者)
  const { 路線列表, 載入中, 載入路線 } = useRouteStore()

  useEffect(() => {
    if (開啟 && 使用者) {
      載入路線(使用者.id)
    }
  }, [開啟, 使用者, 載入路線])

  const 選取 = (route: SavedRoute) => {
    onSelect(route)
    關閉()
  }

  return (
    <Modal 開啟={開啟} 關閉={關閉} 標題="選擇路線">
      {載入中 ? (
        <p className="text-center text-gray-500 py-8 text-sm">載入中…</p>
      ) : 路線列表.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Map size={36} className="mx-auto mb-3" />
          <p className="text-sm">尚無儲存的路線</p>
          <p className="text-xs mt-1">前往「路線」頁面新增路線</p>
        </div>
      ) : (
        <div className="space-y-3">
          {路線列表.map(route => (
            <RouteCard
              key={route.id}
              route={route}
              selectable
              onSelect={選取}
            />
          ))}
        </div>
      )}
    </Modal>
  )
}

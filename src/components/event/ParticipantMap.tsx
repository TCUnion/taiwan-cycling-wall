import { 查找縣市 } from '../../data/counties'
import { 模擬使用者 } from '../../data/mockUsers'
import Avatar from '../ui/Avatar'

interface Props {
  participantIds: string[]
}

export default function ParticipantMap({ participantIds }: Props) {
  // 根據使用者所在縣市分組
  const 分組 = participantIds.reduce<Record<string, string[]>>((acc, userId) => {
    const user = 模擬使用者.find(u => u.id === userId)
    if (!user) return acc
    const 縣市 = 查找縣市(user.countyId)
    const key = 縣市?.name || '未知'
    if (!acc[key]) acc[key] = []
    acc[key].push(userId)
    return acc
  }, {})

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">🗺️ 參加者分布</h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(分組).map(([縣市名, userIds]) => (
          <div key={縣市名} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
            <span className="text-sm font-medium">{縣市名}</span>
            <span className="text-xs text-gray-500">{userIds.length}人</span>
            <div className="flex -space-x-1">
              {userIds.slice(0, 3).map(uid => {
                const u = 模擬使用者.find(u => u.id === uid)
                return u ? <Avatar key={uid} emoji={u.avatar} size="sm" /> : null
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

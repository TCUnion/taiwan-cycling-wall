// 管理員後台 — 使用者管理 + 角色設定

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Shield, Users, Settings, Save, Plus, Trash2, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import type { UserRole } from '../types'
import Avatar from '../components/ui/Avatar'
import {
  取得所有角色,
  更新角色設定,
  新增角色,
  刪除角色,
  更新使用者角色,
  取得所有使用者,
} from '../utils/roleService'

type Tab = 'users' | 'roles'

// 管理員用使用者資料（從 Supabase 讀取）
interface AdminUser {
  id: string
  name: string
  avatar: string
  role: string
  authProvider: string
  email?: string
  verifiedAt?: string
  countyId?: string
}

function fromRow(row: Record<string, unknown>): AdminUser {
  return {
    id: row.id as string,
    name: (row.name as string) || '未命名',
    avatar: (row.avatar as string) || '',
    role: (row.role as string) || 'unverified',
    authProvider: (row.auth_provider as string) || '',
    email: row.email as string | undefined,
    verifiedAt: row.verified_at as string | undefined,
    countyId: row.county_id as string | undefined,
  }
}

export default function AdminPage() {
  const navigate = useNavigate()
  const 使用者 = useAuthStore(s => s.使用者)
  const [分頁, set分頁] = useState<Tab>('users')
  const [角色列表, set角色列表] = useState<UserRole[]>([])
  const [所有使用者, set所有使用者] = useState<AdminUser[]>([])
  const [搜尋, set搜尋] = useState('')
  const [載入中, set載入中] = useState(true)
  const [篩選角色, set篩選角色] = useState<string>('')

  // 檢查管理員權限
  if (!使用者 || 使用者.role !== 'admin') {
    navigate('/wall', { replace: true })
    return null
  }

  // 載入資料
  useEffect(() => {
    載入資料()
  }, [])

  async function 載入資料() {
    set載入中(true)
    const [角色, 使用者資料] = await Promise.all([
      取得所有角色(),
      取得所有使用者(),
    ])
    set角色列表(角色)
    set所有使用者(使用者資料.map(fromRow))
    set載入中(false)
  }

  // 篩選使用者
  const 篩選後使用者 = 所有使用者.filter(u => {
    if (搜尋) {
      const q = 搜尋.toLowerCase()
      if (!u.name.toLowerCase().includes(q) && !u.id.toLowerCase().includes(q) && !(u.email?.toLowerCase().includes(q))) {
        return false
      }
    }
    if (篩選角色 && u.role !== 篩選角色) return false
    return true
  })

  return (
    <div className="min-h-svh bg-gray-50">
      {/* 頂部導覽列 */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="返回個人中心"
          >
            <ArrowLeft size={20} />
          </button>
          <Shield size={20} className="text-strava" />
          <h1 className="font-bold text-lg">管理後台</h1>
        </div>
      </header>

      {/* 分頁切換 */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => set分頁('users')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              分頁 === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={16} />
            使用者管理
          </button>
          <button
            onClick={() => set分頁('roles')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              分頁 === 'roles' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings size={16} />
            角色設定
          </button>
        </div>
      </div>

      {/* 內容 */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {載入中 ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-3 border-strava border-t-transparent rounded-full animate-spin" />
          </div>
        ) : 分頁 === 'users' ? (
          <使用者管理分頁
            使用者列表={篩選後使用者}
            角色列表={角色列表}
            搜尋={搜尋}
            set搜尋={set搜尋}
            篩選角色={篩選角色}
            set篩選角色={set篩選角色}
            onRoleChange={async (userId, newRole) => {
              const 成功 = await 更新使用者角色(userId, newRole)
              if (成功) {
                set所有使用者(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
                // 也更新本地 authStore 的所有使用者（如果修改的是目前登入使用者）
                const authStore = useAuthStore.getState()
                if (authStore.使用者?.id === userId) {
                  authStore.更新使用者({ role: newRole })
                }
              }
            }}
          />
        ) : (
          <角色設定分頁
            角色列表={角色列表}
            onUpdate={async (id, fields) => {
              const 成功 = await 更新角色設定(id, fields)
              if (成功) {
                set角色列表(prev => prev.map(r => r.id === id ? { ...r, ...fields } : r))
              }
            }}
            onAdd={async (role) => {
              const 成功 = await 新增角色(role)
              if (成功) {
                set角色列表(prev => [...prev, role].sort((a, b) => a.sortOrder - b.sortOrder))
              }
            }}
            onDelete={async (id) => {
              const 成功 = await 刪除角色(id)
              if (成功) {
                set角色列表(prev => prev.filter(r => r.id !== id))
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

// ========== 使用者管理分頁 ==========

function 使用者管理分頁({
  使用者列表,
  角色列表,
  搜尋,
  set搜尋,
  篩選角色,
  set篩選角色,
  onRoleChange,
}: {
  使用者列表: AdminUser[]
  角色列表: UserRole[]
  搜尋: string
  set搜尋: (v: string) => void
  篩選角色: string
  set篩選角色: (v: string) => void
  onRoleChange: (userId: string, newRole: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* 搜尋 + 篩選列 */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={搜尋}
            onChange={e => set搜尋(e.target.value)}
            placeholder="搜尋姓名、ID 或 email…"
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-strava/30"
          />
        </div>
        <select
          value={篩選角色}
          onChange={e => set篩選角色(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm cursor-pointer"
          name="role-filter"
        >
          <option value="">全部角色</option>
          {角色列表.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* 統計 */}
      <p className="text-xs text-gray-500">共 {使用者列表.length} 位使用者</p>

      {/* 使用者列表 */}
      <div className="space-y-2">
        {使用者列表.map(u => (
          <div key={u.id} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
            <Avatar emoji={u.avatar} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm truncate">{u.name}</span>
                {u.verifiedAt && <ShieldCheck size={14} className="text-emerald-600 shrink-0" />}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400 truncate">{u.id}</span>
                {u.authProvider && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium leading-none ${
                    ({ facebook: 'bg-facebook/10 text-facebook', google: 'bg-google/10 text-google', line: 'bg-line/10 text-line', strava: 'bg-strava/10 text-strava' } as Record<string, string>)[u.authProvider] ?? 'bg-gray-100 text-gray-500'
                  }`}>
                    {{ facebook: 'Facebook', google: 'Google', line: 'LINE', strava: 'Strava' }[u.authProvider] ?? u.authProvider}
                  </span>
                )}
                {u.verifiedAt && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium leading-none">LINE 已認證</span>
                )}
              </div>
              {u.email && <p className="text-xs text-gray-400 truncate">{u.email}</p>}
            </div>
            <div className="shrink-0">
              <select
                value={u.role}
                onChange={e => onRoleChange(u.id, e.target.value)}
                className="px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 cursor-pointer focus:ring-2 focus:ring-strava/30 focus:outline-none"
                name={`role-${u.id}`}
              >
                {角色列表.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {使用者列表.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">沒有符合條件的使用者</p>
        )}
      </div>
    </div>
  )
}

// ========== 角色設定分頁 ==========

function 角色設定分頁({
  角色列表,
  onUpdate,
  onAdd,
  onDelete,
}: {
  角色列表: UserRole[]
  onUpdate: (id: string, fields: Partial<UserRole>) => void
  onAdd: (role: UserRole) => void
  onDelete: (id: string) => void
}) {
  const 內建角色 = ['unverified', 'verified', 'admin']
  const [新角色名稱, set新角色名稱] = useState('')
  const [新角色Id, set新角色Id] = useState('')
  const [新角色額度, set新角色額度] = useState(5)
  const [顯示新增, set顯示新增] = useState(false)
  // 編輯中的角色
  const [編輯中, set編輯中] = useState<Record<string, { name: string; maxActiveEvents: number }>>({})

  function 開始編輯(role: UserRole) {
    set編輯中(prev => ({ ...prev, [role.id]: { name: role.name, maxActiveEvents: role.maxActiveEvents } }))
  }

  function 儲存編輯(id: string) {
    const 值 = 編輯中[id]
    if (值) {
      onUpdate(id, 值)
      set編輯中(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">設定各角色可同時存在的活動數量上限</p>

      <div className="space-y-2">
        {角色列表.map(r => {
          const 正在編輯 = 編輯中[r.id]
          const 是內建 = 內建角色.includes(r.id)

          return (
            <div key={r.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  {正在編輯 ? (
                    <input
                      type="text"
                      value={正在編輯.name}
                      onChange={e => set編輯中(prev => ({ ...prev, [r.id]: { ...prev[r.id], name: e.target.value } }))}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-strava/30"
                      disabled={是內建 && r.id === 'admin'}
                    />
                  ) : (
                    <span className="font-medium text-sm">{r.name}</span>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">ID: {r.id}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-xs text-gray-500">活動上限</label>
                  {正在編輯 ? (
                    <input
                      type="number"
                      value={正在編輯.maxActiveEvents}
                      onChange={e => set編輯中(prev => ({
                        ...prev,
                        [r.id]: { ...prev[r.id], maxActiveEvents: Math.max(0, parseInt(e.target.value) || 0) },
                      }))}
                      className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-strava/30"
                      min={0}
                    />
                  ) : (
                    <span className="inline-flex items-center justify-center w-10 h-7 bg-gray-100 rounded text-sm font-medium">
                      {r.maxActiveEvents >= 999 ? '∞' : r.maxActiveEvents}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {正在編輯 ? (
                    <button
                      onClick={() => 儲存編輯(r.id)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                      aria-label="儲存"
                    >
                      <Save size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => 開始編輯(r)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                      aria-label="編輯"
                    >
                      <Settings size={16} />
                    </button>
                  )}
                  {!是內建 && (
                    <button
                      onClick={() => {
                        if (confirm(`確定要刪除角色「${r.name}」嗎？`)) {
                          onDelete(r.id)
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      aria-label="刪除角色"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 新增角色 */}
      {顯示新增 ? (
        <div className="bg-white rounded-lg border-2 border-dashed border-strava/30 p-4 space-y-3">
          <h4 className="text-sm font-medium">新增角色</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">角色 ID（英文）</label>
              <input
                type="text"
                value={新角色Id}
                onChange={e => set新角色Id(e.target.value.replace(/[^a-z0-9_]/g, ''))}
                placeholder="例如 vip"
                className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-strava/30"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">顯示名稱</label>
              <input
                type="text"
                value={新角色名稱}
                onChange={e => set新角色名稱(e.target.value)}
                placeholder="例如 VIP 會員"
                className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-strava/30"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">同時活動上限</label>
            <input
              type="number"
              value={新角色額度}
              onChange={e => set新角色額度(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-20 mt-1 px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-strava/30"
              min={0}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                if (!新角色Id || !新角色名稱) return
                onAdd({
                  id: 新角色Id,
                  name: 新角色名稱,
                  maxActiveEvents: 新角色額度,
                  sortOrder: 角色列表.length,
                })
                set新角色Id('')
                set新角色名稱('')
                set新角色額度(5)
                set顯示新增(false)
              }}
              disabled={!新角色Id || !新角色名稱}
              className="px-4 py-2 bg-strava text-white rounded-lg text-sm font-medium hover:bg-strava/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              新增
            </button>
            <button
              onClick={() => set顯示新增(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => set顯示新增(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-strava/30 hover:text-strava transition-colors cursor-pointer"
        >
          <Plus size={16} />
          新增自訂角色
        </button>
      )}
    </div>
  )
}

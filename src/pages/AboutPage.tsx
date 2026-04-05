// 關於我們頁面 — E-E-A-T：展示 TCU 組織可信度與平台 Experience 信號

import { useEffect, useState } from 'react'
import { ArrowLeft, Bike, MapPin, Users, Shield, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import { supabase } from '../utils/supabase'

const 平台特色 = [
  {
    icon: MapPin,
    title: '22 縣市全覆蓋',
    desc: '從北到南、從西到東，台灣 22 縣市的約騎活動一網打盡，依你的所在地自動篩選。',
  },
  {
    icon: Users,
    title: '實名制，真實社群',
    desc: '以 Facebook 帳號實名登入，讓每場約騎都有真實的主辦人，騎友間互相認識更安心。',
  },
  {
    icon: Bike,
    title: '輕鬆發起約騎',
    desc: '填入路線、集合地點、時間，一分鐘發起約騎，自動推播給同縣市的騎友。',
  },
  {
    icon: Shield,
    title: '隱私優先設計',
    desc: '資料僅存於你的瀏覽器本地，不傳第三方。不需要也不保留你的行蹤紀錄。',
  },
]

interface Stats {
  events: number | null
  users: number | null
}

export default function AboutPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ events: null, users: null })

  useEffect(() => {
    async function 載入統計() {
      const [eventsResult, usersResult] = await Promise.all([
        supabase.from('cycling_events').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
      ])
      setStats({
        events: eventsResult.count,
        users: usersResult.count,
      })
    }
    載入統計()
  }, [])

  usePageMeta(
    '關於我們 — 相揪約騎公布欄',
    '相揪（siokiu）是 TCU 台灣單車聯盟打造的單車約騎社群平台，服務台灣 22 縣市的自行車愛好者。',
    'https://siokiu.criterium.tw/about'
  )

  return (
    <main className="min-h-svh bg-white">

      {/* Organization JSON-LD（About 頁面即為組織實體頁，補強 E-E-A-T） */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SportsOrganization',
            '@id': 'https://www.criterium.tw/#organization',
            'name': 'TCU — Taiwan Cyclist United',
            'alternateName': '台灣單車聯盟',
            'url': 'https://www.criterium.tw',
            'description': 'TCU（Taiwan Cyclist United）台灣單車聯盟，致力推廣台灣自行車運動，舉辦賽事並提供社群平台服務。',
            'foundingDate': '2020',
            'sport': 'Cycling',
            'areaServed': { '@type': 'Country', 'name': 'Taiwan' },
            'contactPoint': {
              '@type': 'ContactPoint',
              'contactType': 'customer support',
              'email': 'service@tsu.com.tw',
              'availableLanguage': ['Chinese', 'zh-Hant-TW'],
            },
            'sameAs': [
              'https://www.facebook.com/criterium.tw',
              'https://www.instagram.com/criterium.tw',
              'https://www.strava.com/clubs/criterium-tw',
            ],
          }),
        }}
      />

      {/* Sticky 頂部導覽 */}
      <div className="sticky top-0 z-30 flex items-center gap-3 bg-white/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="p-2 -ml-1 rounded-full cursor-pointer hover:bg-black/5 transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">關於我們</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">

        {/* Hero */}
        <section className="text-center space-y-3">
          <h2 className="font-serif text-5xl text-gray-900 tracking-tight select-none">
            siokiu
          </h2>
          <p className="text-gray-500 text-sm">
            <span className="font-semibold text-gray-700">台語</span>
            <span className="mx-1.5 text-gray-400">·</span>
            <span>動詞</span>
            <span className="mx-1.5 text-gray-400">｜</span>
            <span className="text-gray-700">相揪，呼朋引伴一起騎車</span>
          </p>
          <p className="text-gray-600 leading-relaxed pt-1">
            相揪是一個台灣單車約騎社群平台，讓騎友可以輕鬆揪伴、公告約騎，
            用台語「相揪」的精神，把單車的快樂傳遞給更多人。
          </p>
        </section>

        {/* 社群統計 — Experience 信號 */}
        {(stats.events !== null || stats.users !== null) && (
          <section className="grid grid-cols-2 gap-4 py-2">
            {stats.events !== null && (
              <div className="text-center">
                <p className="text-3xl font-bold text-strava">{stats.events.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">累計約騎場次</p>
              </div>
            )}
            {stats.users !== null && (
              <div className="text-center">
                <p className="text-3xl font-bold text-strava">{stats.users.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">活躍騎友人數</p>
              </div>
            )}
          </section>
        )}

        {/* 平台特色 */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-gray-900">平台特色</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {平台特色.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="border border-gray-100 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-strava shrink-0" />
                  <span className="font-semibold text-sm text-gray-800">{title}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 關於 TCU */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">關於 TCU</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            相揪由 <strong>TCU（Taiwan Cyclist United）台灣單車聯盟</strong> 開發與維運。
            TCU 成立於 2020 年，致力於推廣台灣自行車運動，旗下包含苗栗繞圈賽、仙山 KOM
            等賽事，以及 ProBikeStores 車店目錄、TCU 小幫手等服務。
          </p>
          <a
            href="https://www.criterium.tw"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-strava hover:underline"
          >
            criterium.tw — TCU 官網
            <ExternalLink size={13} />
          </a>
        </section>

        {/* TCU 旗下服務 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">TCU 旗下服務</h2>
          <ul className="text-sm text-gray-700 space-y-2">
            {[
              { name: '苗栗繞圈賽', url: 'https://miaoli2026.criterium.tw', desc: '年度公路繞圈賽事' },
              { name: 'ProBikeStores', url: 'https://probikestores.criterium.tw', desc: '台灣單車店目錄' },
              { name: 'TCU 小幫手', url: 'https://strava.criterium.tw', desc: 'Strava 成績驗證與賽事報名' },
            ].map(({ name, url, desc }) => (
              <li key={name} className="flex items-center justify-between">
                <span>
                  <span className="font-medium">{name}</span>
                  <span className="text-gray-400 ml-2">{desc}</span>
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-strava hover:underline flex items-center gap-1"
                  aria-label={`前往 ${name}`}
                >
                  <ExternalLink size={13} />
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* 聯絡我們 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-gray-900">聯絡我們</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            有任何問題或建議，歡迎來信：
            <a href="mailto:service@tsu.com.tw" className="text-strava underline ml-1">
              service@tsu.com.tw
            </a>
          </p>
          <p className="text-sm text-gray-500">
            或透過{' '}
            <a
              href="https://www.facebook.com/criterium.tw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-strava hover:underline"
            >
              TCU Facebook 粉絲頁
            </a>{' '}
            留言聯繫我們。
          </p>
        </section>

      </div>
    </main>
  )
}

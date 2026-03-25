/**
 * 建置後預渲染腳本
 * 使用 Puppeteer 訪問每個路由，將渲染完的 HTML 寫入 dist/
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import puppeteer from 'puppeteer'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '..', 'dist')
const PORT = 4936 // 預渲染用的臨時埠號
// 各頁獨立的 title、description 與 canonical 路徑
const 路由設定 = {
  '/': {
    title: '台灣約騎事件簿 — 單車約騎社群平台 | 涵蓋北中南東 22 縣市，找人一起騎車吧！',
    description: '台灣約騎事件簿是最活躍的單車約騎社群平台。涵蓋北中南東 22 縣市經典自行車路線，輕鬆發起或加入約騎活動，認識車友、分享騎乘紀錄。不論公路車、登山車或休閒騎，都能找到志同道合的車友一起探索台灣最美的騎行路線。',
    canonical: 'https://yakiboard.tw/',
  },
  '/login': {
    title: '登入台灣約騎事件簿 — 選擇你的車友角色，立即開始約騎探索台灣自行車路線',
    description: '登入台灣約騎事件簿，選擇你的車友角色，立即瀏覽並加入全台北中南東各地的單車約騎活動。與車友們一起探索河濱車道、北海岸、日月潭、武嶺等經典路線，開啟你的下一趟騎行旅程。',
    canonical: 'https://yakiboard.tw/login',
  },
  '/wall': {
    title: '約騎牆 — 瀏覽全台單車約騎活動 | 台灣約騎事件簿，北中南東 22 縣市路線',
    description: '瀏覽台灣北中南東各地最新的單車約騎活動，依區域與縣市篩選，找到適合你的路線與車友。從河濱晨騎到山路挑戰，各種難度與距離一應俱全，一起出發探索台灣最美的自行車路線吧！',
    canonical: 'https://yakiboard.tw/wall',
  },
}
const 路由列表 = Object.keys(路由設定)

// 啟動簡易靜態伺服器
function 啟動靜態伺服器() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let 路徑 = req.url === '/' ? '/index.html' : req.url
      // SPA fallback：找不到檔案時回傳 index.html
      let 檔案路徑 = join(DIST, 路徑)
      try {
        const content = readFileSync(檔案路徑)
        const ext = 路徑.split('.').pop()
        const mime = {
          html: 'text/html',
          js: 'application/javascript',
          css: 'text/css',
          json: 'application/json',
          png: 'image/png',
          svg: 'image/svg+xml',
          ico: 'image/x-icon',
          webmanifest: 'application/manifest+json',
        }[ext] || 'application/octet-stream'
        res.writeHead(200, { 'Content-Type': mime })
        res.end(content)
      } catch {
        // SPA fallback
        const html = readFileSync(join(DIST, 'index.html'))
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(html)
      }
    })
    server.listen(PORT, () => resolve(server))
  })
}

async function 預渲染() {
  console.log('🚀 開始預渲染...')
  const server = await 啟動靜態伺服器()
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  for (const 路由 of 路由列表) {
    console.log(`  📄 預渲染 ${路由}`)
    const page = await browser.newPage()

    // 注入預渲染標記
    await page.evaluateOnNewDocument(() => {
      window.__PRERENDER_INJECTED = { isPrerendering: true }
    })

    await page.goto(`http://localhost:${PORT}${路由}`, {
      waitUntil: 'networkidle0',
    })

    // 等待 prerender-ready 事件（最多 10 秒）
    await page.evaluate(() => {
      return new Promise((resolve) => {
        if (document.querySelector('main')) {
          resolve(undefined)
          return
        }
        document.addEventListener('prerender-ready', () => resolve(undefined))
        setTimeout(() => resolve(undefined), 10000)
      })
    })

    // 額外等待一下確保 React 渲染完成
    await new Promise(r => setTimeout(r, 1000))

    let html = await page.content()
    await page.close()

    // 移除 noscript 區塊（預渲染後已有完整內容，避免重複 h1）
    html = html.replace(/<noscript>[\s\S]*?<\/noscript>/g, '')

    // 替換各頁獨立的 title、description、canonical、OG 標籤
    const 設定 = 路由設定[路由]
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${設定.title}</title>`)
    html = html.replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${設定.description}"`
    )
    html = html.replace(
      /<link rel="canonical" href="[^"]*"/,
      `<link rel="canonical" href="${設定.canonical}"`
    )
    // OG tags
    html = html.replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${設定.title}"`
    )
    html = html.replace(
      /<meta property="og:description" content="[^"]*"/,
      `<meta property="og:description" content="${設定.description}"`
    )
    html = html.replace(
      /<meta property="og:url" content="[^"]*"/,
      `<meta property="og:url" content="${設定.canonical}"`
    )
    // Twitter tags
    html = html.replace(
      /<meta name="twitter:title" content="[^"]*"/,
      `<meta name="twitter:title" content="${設定.title}"`
    )
    html = html.replace(
      /<meta name="twitter:description" content="[^"]*"/,
      `<meta name="twitter:description" content="${設定.description}"`
    )

    // 寫入對應的路徑
    if (路由 === '/') {
      writeFileSync(join(DIST, 'index.html'), html, 'utf-8')
    } else {
      const 目錄 = join(DIST, 路由)
      mkdirSync(目錄, { recursive: true })
      writeFileSync(join(目錄, 'index.html'), html, 'utf-8')
    }

    console.log(`  ✅ ${路由} 完成`)
  }

  await browser.close()
  server.close()
  console.log('🎉 預渲染完成！')
}

預渲染().catch(err => {
  console.warn('⚠️ 預渲染失敗（將使用未預渲染的 SPA 版本）:', err.message)
  // 不以 exit(1) 終止，讓建置繼續完成
})

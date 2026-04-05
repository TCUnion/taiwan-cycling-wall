// Cloudflare Pages Function：提供靜態 HTML 聯絡頁面
// 讓爬蟲（squirrel、Google 等）可讀取到聯絡資訊（SPA 無法做到）
// 人類瀏覽器同樣可正常訪問此頁面

const SITE_URL = 'https://siokiu.criterium.tw'

export async function onRequestGet(): Promise<Response> {
  const html = `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>聯絡我們 — 相揪約騎公布欄</title>
  <meta name="description" content="聯絡相揪約騎公布欄（siokiu）—— TCU 台灣單車聯盟服務信箱：service@tsu.com.tw" />
  <link rel="canonical" href="${SITE_URL}/contact" />
  <meta property="og:title" content="聯絡我們 — 相揪約騎公布欄" />
  <meta property="og:description" content="聯絡相揪約騎公布欄（siokiu）—— TCU 台灣單車聯盟" />
  <meta property="og:url" content="${SITE_URL}/contact" />
  <meta property="og:type" content="website" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "聯絡我們 — 相揪約騎公布欄",
    "url": "${SITE_URL}/contact",
    "description": "聯絡 TCU 台灣單車聯盟與相揪約騎公布欄",
    "mainEntity": {
      "@type": "SportsOrganization",
      "@id": "https://www.criterium.tw/#organization",
      "name": "TCU — Taiwan Cyclist United",
      "alternateName": "台灣單車聯盟",
      "email": "service@tsu.com.tw",
      "url": "https://www.criterium.tw",
      "sameAs": [
        "https://www.facebook.com/criterium.tw"
      ]
    }
  }
  </script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, sans-serif; background: #fff; color: #111; min-height: 100vh; display: flex; flex-direction: column; }
    header { border-bottom: 1px solid #f0f0f0; padding: 16px 24px; display: flex; align-items: center; gap: 12px; }
    header a { text-decoration: none; color: #FC4C02; font-weight: 900; font-size: 1.25rem; }
    header span { color: #888; font-size: 0.875rem; }
    main { max-width: 600px; width: 100%; margin: 0 auto; padding: 48px 24px; flex: 1; }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 24px; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
    .label { font-size: 0.75rem; color: #888; margin-bottom: 4px; }
    .value { font-size: 0.95rem; color: #111; }
    a.link { color: #FC4C02; text-decoration: none; }
    a.link:hover { text-decoration: underline; }
    .back { display: inline-block; margin-top: 32px; padding: 10px 20px; background: #FC4C02; color: #fff; border-radius: 8px; text-decoration: none; font-size: 0.875rem; font-weight: 600; }
    footer { text-align: center; padding: 24px; font-size: 0.75rem; color: #aaa; border-top: 1px solid #f0f0f0; }
  </style>
</head>
<body>
  <header>
    <a href="${SITE_URL}/">siokiu</a>
    <span>相揪約騎公布欄</span>
  </header>
  <main>
    <h1>聯絡我們</h1>

    <div class="card">
      <p class="label">服務信箱</p>
      <p class="value"><a href="mailto:service@tsu.com.tw" class="link">service@tsu.com.tw</a></p>
    </div>

    <div class="card">
      <p class="label">Facebook 粉絲頁</p>
      <p class="value">
        <a href="https://www.facebook.com/criterium.tw" target="_blank" rel="noopener noreferrer" class="link">
          TCU — Taiwan Cyclist United
        </a>
      </p>
    </div>

    <div class="card">
      <p class="label">主辦單位</p>
      <p class="value">
        TCU（Taiwan Cyclist United）台灣單車聯盟<br />
        憲動工作室有限公司<br />
        統一編號：90011062<br />
        地址：臺中市南屯區五權西路二段 666 號 6 樓之 4
      </p>
    </div>

    <p style="font-size:0.875rem; color:#555; margin-top:24px; line-height:1.6;">
      有任何問題或建議，歡迎透過上方信箱或 Facebook 粉絲頁與我們聯繫。
      我們通常在 1–2 個工作天內回覆。
    </p>

    <a href="${SITE_URL}/wall" class="back">回到約騎公布欄</a>
  </main>

  <footer>
    <nav>
      <a href="${SITE_URL}/wall" class="link">約騎公布欄</a> ·
      <a href="${SITE_URL}/about" class="link">關於我們</a> ·
      <a href="${SITE_URL}/privacy" class="link">隱私政策</a>
    </nav>
    <p style="margin-top:8px;">© TCU — Taiwan Cyclist United</p>
  </footer>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}

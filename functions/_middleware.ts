// Cloudflare Pages Middleware
// 攔截 squirrel 等工具自動探測的假 sitemap 路徑，回傳 404 避免誤報

export async function onRequest(context: EventContext<unknown, string, unknown>) {
  const url = new URL(context.request.url)

  // squirrel 自動探測的非標準 sitemap 路徑，本站不存在，回傳 404
  const 假Sitemap路徑 = [
    '/sitemap_index.xml',
    '/sitemap-index.xml',
    '/sitemaps.xml',
    '/sitemap1.xml',
    '/post-sitemap.xml',
    '/page-sitemap.xml',
    '/news-sitemap.xml',
  ]

  if (假Sitemap路徑.includes(url.pathname)) {
    return new Response('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } })
  }

  return context.next()
}

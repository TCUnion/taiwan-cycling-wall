import DOMPurify from 'dompurify'

// 允許的 HTML 標籤白名單（僅限簡易 Markdown 轉換後的標籤）
const 允許的標籤 = ['strong', 'em', 'br', 'ul', 'li', 'p']

/**
 * 將簡易 Markdown 文字轉為安全的 HTML。
 * 1. 先跳脫所有 HTML
 * 2. 轉換 Markdown（粗體、列表）
 * 3. 用 DOMPurify 淨化，僅允許白名單標籤
 */
export function 安全渲染Markdown(text: string): string {
  // 先跳脫 HTML 特殊字元
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 粗體
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // 列表：連續以 - 開頭的行轉為 <ul><li>
  html = html.replace(/(^|\n)(- .+(?:\n- .+)*)/g, (_match, prefix, block) => {
    const items = block
      .split('\n')
      .map((line: string) => `<li>${line.slice(2)}</li>`)
      .join('')
    return `${prefix}<ul>${items}</ul>`
  })

  // 剩餘換行轉 <br>
  html = html.replace(/\n/g, '<br>')

  // DOMPurify 淨化，僅允許白名單標籤，禁止所有屬性
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: 允許的標籤,
    ALLOWED_ATTR: [],
  })
}

/** 移除所有 HTML 標籤，回傳純文字（用於 meta tag、title 等） */
export function 淨化純文字(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] })
}

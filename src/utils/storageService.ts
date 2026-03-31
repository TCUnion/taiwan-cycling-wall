import { supabase } from './supabase'

const BUCKET = 'stamps'
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

/**
 * 上傳 base64 data URL 圖片到 Supabase Storage，回傳公開 URL。
 * 若本身已是 http URL、MIME 不在白名單、超過 2MB 或上傳失敗，回傳原始值。
 */
export async function 上傳圖章到Storage(dataUrl: string, eventId: string): Promise<string> {
  if (!dataUrl.startsWith('data:')) return dataUrl

  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) return dataUrl

  const mimeType = matches[1]
  if (!ALLOWED_MIME.includes(mimeType)) return dataUrl

  const base64 = matches[2]
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'

  // base64 → Uint8Array
  const binaryStr = atob(base64)
  if (binaryStr.length > MAX_SIZE) return dataUrl
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }

  const filePath = `events/${eventId}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, bytes, {
      contentType: mimeType,
      upsert: true,
    })

  if (error) {
    console.warn('[Storage] 上傳圖章失敗:', error.message)
    return dataUrl
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}

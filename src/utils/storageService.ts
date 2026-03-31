import { supabase } from './supabase'

const BUCKET = 'stamps'

/**
 * 上傳 base64 data URL 圖片到 Supabase Storage，回傳公開 URL。
 * 若本身已是 http URL 或上傳失敗，回傳原始值。
 */
export async function 上傳圖章到Storage(dataUrl: string, eventId: string): Promise<string> {
  if (!dataUrl.startsWith('data:')) return dataUrl

  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) return dataUrl

  const mimeType = matches[1]
  const base64 = matches[2]
  const ext = mimeType === 'image/png' ? 'png' : 'jpg'

  // base64 → Uint8Array
  const binaryStr = atob(base64)
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

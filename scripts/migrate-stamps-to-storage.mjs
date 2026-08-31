// 把 cycling_events.cover_image 裡的 base64 圖章搬進 Supabase Storage（stamps bucket），
// 欄位改存公開 URL。可重複執行，已是 http 開頭的略過。
//
// 用法：
//   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/migrate-stamps-to-storage.mjs [--dry-run]
//
// 需要 service_role 金鑰（要繞過 RLS 讀寫全部活動）。金鑰不要寫進這個 repo。

import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY
const DRY = process.argv.includes('--dry-run')

if (!URL || !KEY) {
  console.error('缺少 SUPABASE_URL 或 SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const BUCKET = 'stamps'
const ALLOWED = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }
const MAX_SIZE = 2 * 1024 * 1024

const supabase = createClient(URL, KEY, { auth: { persistSession: false } })

const { data: rows, error } = await supabase
  .from('cycling_events')
  .select('id,cover_image')
  .like('cover_image', 'data:%')

if (error) {
  console.error('讀取活動失敗:', error.message)
  process.exit(1)
}

console.log(`找到 ${rows.length} 筆 base64 圖章${DRY ? '（dry-run，不寫入）' : ''}`)

let 成功 = 0
let 略過 = 0
let 失敗 = 0

for (const row of rows) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(row.cover_image)
  if (!m) {
    console.warn(`  略過 ${row.id}：不是合法的 data URL`)
    略過++
    continue
  }

  const [, mime, base64] = m
  const ext = ALLOWED[mime]
  if (!ext) {
    console.warn(`  略過 ${row.id}：MIME ${mime} 不在白名單`)
    略過++
    continue
  }

  const bytes = Buffer.from(base64, 'base64')
  if (bytes.length > MAX_SIZE) {
    console.warn(`  略過 ${row.id}：${(bytes.length / 1024).toFixed(0)} KB 超過 2MB`)
    略過++
    continue
  }

  const filePath = `events/${row.id}.${ext}`

  if (DRY) {
    console.log(`  [dry-run] ${row.id} → ${filePath}（${(bytes.length / 1024).toFixed(1)} KB）`)
    成功++
    continue
  }

  const { error: 上傳錯誤 } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, bytes, { contentType: mime, upsert: true })

  if (上傳錯誤) {
    console.error(`  失敗 ${row.id}：${上傳錯誤.message}`)
    失敗++
    continue
  }

  const { data: 公開 } = supabase.storage.from(BUCKET).getPublicUrl(filePath)

  const { error: 更新錯誤 } = await supabase
    .from('cycling_events')
    .update({ cover_image: 公開.publicUrl })
    .eq('id', row.id)

  if (更新錯誤) {
    console.error(`  失敗 ${row.id}：欄位更新 ${更新錯誤.message}`)
    失敗++
    continue
  }

  console.log(`  完成 ${row.id} → ${公開.publicUrl}`)
  成功++
}

console.log(`\n成功 ${成功} 筆、略過 ${略過} 筆、失敗 ${失敗} 筆`)
process.exit(失敗 > 0 ? 1 : 0)

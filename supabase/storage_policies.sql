-- Supabase Storage（stamps bucket）的權限設定 — 2026-08-31 建立
--
-- 背景：storage.objects 的 RLS 一直是開著的，但這個專案從來沒有替它建過任何 policy，
-- 所以前端 storageService.ts 的上傳一律被擋。上傳失敗時它會 return dataUrl（靜默退回
-- base64），結果 76 筆活動裡有 38 筆把整張圖章塞進 cycling_events.cover_image，
-- 佔 1 MB，而且 functions/event/[[id]].ts 遇到 data: 開頭會改用預設 OG 圖，
-- 等於那 38 個活動分享出去都看不到自己的圖章。
--
-- 既有 base64 的搬遷腳本：scripts/migrate-stamps-to-storage.mjs

BEGIN;

-- bucket 限制與前端 storageService.ts 的白名單一致
update storage.buckets
set file_size_limit = 2 * 1024 * 1024,
    allowed_mime_types = array['image/png','image/jpeg','image/webp']
where id = 'stamps';

drop policy if exists "stamps_public_read" on storage.objects;
drop policy if exists "stamps_authenticated_insert" on storage.objects;
drop policy if exists "stamps_authenticated_update" on storage.objects;
drop policy if exists "stamps_authenticated_delete" on storage.objects;

-- 公開讀（bucket 本身是 public，補這條讓 list/HEAD 也一致）
create policy "stamps_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'stamps');

-- 只有登入者能寫，且只能寫進 events/ 路徑
create policy "stamps_authenticated_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'stamps' and (storage.foldername(name))[1] = 'events');

create policy "stamps_authenticated_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'stamps' and (storage.foldername(name))[1] = 'events')
  with check (bucket_id = 'stamps' and (storage.foldername(name))[1] = 'events');

create policy "stamps_authenticated_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'stamps' and (storage.foldername(name))[1] = 'events');

-- 公布欄改成只抓未過期活動後，date 會進 where 條件
create index if not exists idx_cycling_events_date on public.cycling_events (date desc);

COMMIT;

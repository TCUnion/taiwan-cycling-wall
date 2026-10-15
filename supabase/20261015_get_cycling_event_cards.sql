-- 約騎卡片的公開摘要（2026-10-15）：給 newtcu（TCU 會員平台）的約騎頁顯示「主辦單位」與路線圖示。
--
-- 為什麼要這支：users 表對 anon 不開放（RLS），訪客讀不到發起人名稱，相揪自己的公布欄對訪客也只能顯示
-- 「匿名」。這支 SECURITY DEFINER 函式只回顯示用的最小欄位，不回 email、帳號 id、登入資訊。
--
-- get_cycling_event_cards(p_event_ids text[])：
--   event_id        約騎 id
--   organizer_name  發起人顯示名稱。粉絲頁（creator_id = 'page-<pageId>'）回該粉絲頁名稱；
--                   個人回 users.name；帳號合併過（merged_into）就用合併後那個帳號的名稱；查不到回 null。
--   is_page         是否以粉絲頁身分發起
--   route_preview   路線縮圖用的座標：route_coordinates 抽樣到最多 60 點（[[lat,lng],...]），沒有路線回 null。
-- 一次最多 200 個 id；不存在的 id 不回。只讀，不改任何資料。
--
-- 套用：只新增一支函式，不改既有物件，重複套用結果相同。這個專案與 24EZGO（ezgo schema）共用，本函式只讀
-- public.cycling_events 與 public.users。
-- 套用後驗證（anon）：
--   select * from public.get_cycling_event_cards(array['demo-forever-01']);  -- 應回一列
--   select email from public.users limit 1;                                  -- 仍應讀不到

create or replace function public.get_cycling_event_cards(p_event_ids text[])
returns table (event_id text, organizer_name text, is_page boolean, route_preview jsonb)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if p_event_ids is null or cardinality(p_event_ids) = 0 then
    return;
  end if;
  if cardinality(p_event_ids) > 200 then
    raise exception 'TOO_MANY_IDS' using errcode = '22023';
  end if;

  return query
  with ev as (
    select e.id, e.creator_id, e.route_coordinates
    from public.cycling_events e
    where e.id = any (p_event_ids)
  ),
  named as (
    select
      ev.id,
      ev.creator_id like 'page-%' as is_page,
      case
        when ev.creator_id like 'page-%' then (
          select p ->> 'name'
          from public.users u
          cross join lateral jsonb_array_elements(
            case when jsonb_typeof(u.managed_pages) = 'array' then u.managed_pages else '[]'::jsonb end
          ) p
          where p ->> 'pageId' = substr(ev.creator_id, 6)
          limit 1
        )
        else (
          select coalesce(target.name, u.name)
          from public.users u
          left join public.users target on target.id = u.merged_into
          where u.id = ev.creator_id
          limit 1
        )
      end as organizer_name,
      ev.route_coordinates
    from ev
  )
  select
    n.id,
    nullif(btrim(n.organizer_name), ''),
    n.is_page,
    case
      when jsonb_typeof(n.route_coordinates) = 'array' and jsonb_array_length(n.route_coordinates) >= 2 then (
        select jsonb_agg(pt.value order by pt.ord)
        from jsonb_array_elements(n.route_coordinates) with ordinality as pt(value, ord)
        cross join (select greatest(1, ceil(jsonb_array_length(n.route_coordinates) / 60.0)::int) as step) s
        where (pt.ord - 1) % s.step = 0 or pt.ord = jsonb_array_length(n.route_coordinates)
      )
    end
  from named n;
end;
$$;

revoke all on function public.get_cycling_event_cards(text[]) from public;
grant execute on function public.get_cycling_event_cards(text[]) to anon, authenticated, service_role;

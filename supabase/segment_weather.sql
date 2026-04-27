-- =============================================================
-- segment_weather.sql
-- Strava Segment 天氣預報長期累積 + 警示視圖
-- 來源：n8n workflow（OpenWeatherMap 5-day forecast，每 12 小時更新）
-- =============================================================

-- -------------------------------------------------------------
-- 1. 主表：segment_weather
--    主鍵 (segment_id, forecast_time)，n8n 用 upsert 寫入
-- -------------------------------------------------------------
create table if not exists public.segment_weather (
  segment_id     bigint        not null,
  forecast_time  timestamptz   not null,
  fetched_at     timestamptz   not null default now(),
  segment_name   text,
  temp           numeric(5,2),
  feels_like     numeric(5,2),
  humidity       int,
  pop            numeric(3,2),         -- 降雨機率 0~1
  rain_3h        numeric(6,2),         -- mm（過去 3 小時）
  wind_speed     numeric(5,2),         -- m/s
  wind_deg       int,
  weather_main   text,
  weather_desc   text,
  icon           text,
  primary key (segment_id, forecast_time)
);

-- 查詢索引：依時間排序（找未來預報、清理舊資料）
create index if not exists idx_segment_weather_time
  on public.segment_weather (forecast_time desc);

-- 查詢索引：依 segment + 時間（前端 segment 詳情頁）
create index if not exists idx_segment_weather_seg_time
  on public.segment_weather (segment_id, forecast_time desc);

-- 自架 Supabase 必做：GRANT 權限
grant all on public.segment_weather to anon, authenticated;

-- RLS：公開讀，寫入需要 service_role（n8n 端）
alter table public.segment_weather enable row level security;

drop policy if exists "weather_read_all" on public.segment_weather;
create policy "weather_read_all"
  on public.segment_weather for select
  using (true);

-- -------------------------------------------------------------
-- 2. 警示視圖：weather_alerts
--    篩出未來 48 小時內任一條件命中的時段，附上警示標籤與嚴重度
-- -------------------------------------------------------------
create or replace view public.weather_alerts as
select
  sw.segment_id,
  sw.segment_name,
  sw.forecast_time,
  sw.temp,
  sw.feels_like,
  sw.pop,
  sw.rain_3h,
  sw.wind_speed,
  sw.wind_deg,
  sw.weather_desc,
  sw.icon,
  -- 警示分類（可多重命中）
  array_remove(array[
    case when sw.pop        >= 0.6  then 'heavy_rain_risk' end,
    case when sw.rain_3h    >= 5    then 'rainy'           end,
    case when sw.wind_speed >= 10   then 'strong_wind'     end,
    case when sw.wind_speed >= 8    then 'windy'           end,
    case when sw.temp       >= 35   then 'hot'             end,
    case when sw.feels_like >= 38   then 'heat_stress'     end,
    case when sw.temp       <= 10   then 'cold'            end
  ], null) as alert_tags,
  -- 嚴重度分數（給排序、通知門檻用）
  (case when sw.pop        >= 0.8 then 3
        when sw.pop        >= 0.6 then 2
        when sw.pop        >= 0.4 then 1 else 0 end)
  + (case when sw.wind_speed >= 12 then 3
          when sw.wind_speed >= 10 then 2
          when sw.wind_speed >= 8  then 1 else 0 end)
  + (case when sw.feels_like >= 38 or sw.temp <= 5 then 2
          when sw.temp >= 35 or sw.temp <= 10      then 1 else 0 end)
  as severity
from public.segment_weather sw
where sw.forecast_time between now() and now() + interval '48 hours'
  and (
       sw.pop        >= 0.6
    or sw.rain_3h    >= 5
    or sw.wind_speed >= 8
    or sw.temp       >= 35
    or sw.temp       <= 10
    or sw.feels_like >= 38
  );

grant select on public.weather_alerts to anon, authenticated;

-- -------------------------------------------------------------
-- 3.（選用）清理函式：移除超過 7 天前的舊預報
--    可在 n8n 裡每天呼叫一次，或用 pg_cron 排程
-- -------------------------------------------------------------
create or replace function public.cleanup_segment_weather()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.segment_weather
  where forecast_time < now() - interval '7 days';
$$;

grant execute on function public.cleanup_segment_weather() to service_role;

-- -------------------------------------------------------------
-- 常用查詢範例（不會執行，僅供參考）
-- -------------------------------------------------------------
-- 未來 48h 各 segment 最嚴重時段
-- select distinct on (segment_id)
--   segment_id, segment_name, forecast_time,
--   alert_tags, severity, weather_desc, pop, wind_speed
-- from weather_alerts
-- order by segment_id, severity desc, forecast_time;
--
-- 今天 severity >= 3 的不適騎時段
-- select segment_name, forecast_time, alert_tags, weather_desc
-- from weather_alerts
-- where forecast_time::date = current_date
--   and severity >= 3
-- order by forecast_time;

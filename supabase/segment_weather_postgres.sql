-- =============================================================
-- segment_weather_postgres.sql
-- 純 PostgreSQL 版（不含 Supabase RLS / anon / authenticated 角色）
-- 適用：自架 PostgreSQL、Neon、RDS、本地 docker postgres 等
-- =============================================================

-- 建議在獨立 schema 下管理（可選）
-- create schema if not exists weather;
-- set search_path = weather, public;

-- -------------------------------------------------------------
-- 1. 主表：segment_weather
-- -------------------------------------------------------------
create table if not exists segment_weather (
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

create index if not exists idx_segment_weather_time
  on segment_weather (forecast_time desc);

create index if not exists idx_segment_weather_seg_time
  on segment_weather (segment_id, forecast_time desc);

-- -------------------------------------------------------------
-- 2. 警示視圖：weather_alerts
--    篩出未來 48 小時內任一條件命中的時段
-- -------------------------------------------------------------
create or replace view weather_alerts as
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
  array_remove(array[
    case when sw.pop        >= 0.6  then 'heavy_rain_risk' end,
    case when sw.rain_3h    >= 5    then 'rainy'           end,
    case when sw.wind_speed >= 10   then 'strong_wind'     end,
    case when sw.wind_speed >= 8    then 'windy'           end,
    case when sw.temp       >= 35   then 'hot'             end,
    case when sw.feels_like >= 38   then 'heat_stress'     end,
    case when sw.temp       <= 10   then 'cold'            end
  ], null) as alert_tags,
  (case when sw.pop        >= 0.8 then 3
        when sw.pop        >= 0.6 then 2
        when sw.pop        >= 0.4 then 1 else 0 end)
  + (case when sw.wind_speed >= 12 then 3
          when sw.wind_speed >= 10 then 2
          when sw.wind_speed >= 8  then 1 else 0 end)
  + (case when sw.feels_like >= 38 or sw.temp <= 5 then 2
          when sw.temp >= 35 or sw.temp <= 10      then 1 else 0 end)
  as severity
from segment_weather sw
where sw.forecast_time between now() and now() + interval '48 hours'
  and (
       sw.pop        >= 0.6
    or sw.rain_3h    >= 5
    or sw.wind_speed >= 8
    or sw.temp       >= 35
    or sw.temp       <= 10
    or sw.feels_like >= 38
  );

-- -------------------------------------------------------------
-- 3. 清理函式：移除超過 7 天的舊預報
--    搭配 pg_cron 排程：select cron.schedule('cleanup_segment_weather','0 3 * * *','select cleanup_segment_weather()');
--    或在 n8n 每天呼叫一次
-- -------------------------------------------------------------
create or replace function cleanup_segment_weather()
returns void
language sql
as $$
  delete from segment_weather
  where forecast_time < now() - interval '7 days';
$$;

-- -------------------------------------------------------------
-- 4. 權限（純 Postgres 版本）
--    依需求調整。下面範例假設你會用 application user 寫入、reader 讀取
-- -------------------------------------------------------------
-- create role app_writer login password 'change-me';
-- create role app_reader login password 'change-me';
-- grant select, insert, update, delete on segment_weather to app_writer;
-- grant select on segment_weather, weather_alerts to app_reader;
-- grant execute on function cleanup_segment_weather() to app_writer;

-- -------------------------------------------------------------
-- 常用查詢範例
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
--
-- 某 segment 過去 7 天平均氣溫趨勢
-- select date_trunc('day', forecast_time) as day,
--        round(avg(temp)::numeric, 1) as avg_temp,
--        round(avg(wind_speed)::numeric, 1) as avg_wind,
--        round(max(pop)::numeric, 2) as max_pop
-- from segment_weather
-- where segment_id = 12345
--   and forecast_time >= now() - interval '7 days'
-- group by 1
-- order by 1;

-- =============================================================
-- weather_points.sql
-- 通用地點天氣快取（給活動建立時查附近天氣用）
-- 鍵：(lat_round, lon_round, forecast_time)
-- lat/lon 四捨五入到 0.1°（約 11 km），同一格網共用快取
-- =============================================================

create table if not exists weather_points (
  lat_round     numeric(4,1)  not null,   -- ex. 24.5
  lon_round     numeric(5,1)  not null,   -- ex. 121.5
  forecast_time timestamptz   not null,
  fetched_at    timestamptz   not null default now(),
  temp          numeric(5,2),
  feels_like    numeric(5,2),
  humidity      int,
  pop           numeric(3,2),
  rain_3h       numeric(6,2),
  wind_speed    numeric(5,2),
  wind_deg      int,
  weather_main  text,
  weather_desc  text,
  icon          text,
  primary key (lat_round, lon_round, forecast_time)
);

create index if not exists idx_weather_points_time
  on weather_points (forecast_time desc);

-- 主鍵 (lat_round, lon_round, forecast_time) 已涵蓋 grid + 時間範圍查詢
-- 不另外建 (lat_round, lon_round, forecast_time::date) 索引：
--   forecast_time::date 對 timestamptz 是 STABLE 不是 IMMUTABLE，無法放進 index 表達式
-- 若真的要用 functional index，需固定時區：
--   create index idx_weather_points_grid_day
--     on weather_points (lat_round, lon_round, ((forecast_time at time zone 'Asia/Taipei')::date));

-- -------------------------------------------------------------
-- 權限與 RLS（自架 Supabase 必要 — 見 CLAUDE.md）
-- -------------------------------------------------------------
grant select on weather_points to anon, authenticated;
grant insert, update, delete on weather_points to service_role;

alter table weather_points enable row level security;

drop policy if exists weather_points_read on weather_points;
create policy weather_points_read
  on weather_points
  for select
  to anon, authenticated
  using (true);

drop policy if exists weather_points_service_write on weather_points;
create policy weather_points_service_write
  on weather_points
  for all
  to service_role
  using (true)
  with check (true);

-- 註：n8n 的 Postgres 節點若以 db user（非 service_role）連線，需另外 GRANT 給該 role：
--   grant insert, update, delete on weather_points to <n8n_db_user>;

-- -------------------------------------------------------------
-- 清理：移除超過 7 天的舊資料
-- -------------------------------------------------------------
create or replace function cleanup_weather_points()
returns void
language sql
as $$
  delete from weather_points
  where forecast_time < now() - interval '7 days';
$$;

-- -------------------------------------------------------------
-- 範例：查 grid 內某日是否有「新鮮」快取（< 6 小時內抓的）
-- -------------------------------------------------------------
-- select count(*) as slots, max(fetched_at) as latest_fetch
-- from weather_points
-- where lat_round   = 24.5
--   and lon_round   = 121.5
--   and forecast_time::date = '2026-05-01'
--   and fetched_at  > now() - interval '6 hours';

// 接收 OpenWeatherMap 16 筆 items（一地一筆），用 Locations 節點配對地名
const items = $input.all();

const REGION_LABEL = {
  north: '🏔️ 北部',
  central: '🌾 中部',
  south: '🌴 南部',
  east: '🌊 東部',
};

// 依區域分組
const groups = { north: [], central: [], south: [], east: [] };

for (let i = 0; i < items.length; i++) {
  const list = items[i].json.list || [];
  const loc = $('Locations').itemMatching(i)?.json;
  if (!loc || list.length === 0) continue;

  // 抓接下來 3 個關鍵時段：今晚 00:00、明日 12:00、後日 12:00
  const slots = [];
  for (const data of list) {
    const t = data.dt_txt || '';
    if (!t.includes('12:00:00') && !t.includes('00:00:00')) continue;
    slots.push(data);
    if (slots.length >= 3) break;
  }

  const slotLines = slots.map(data => {
    const tw = DateTime.fromFormat(data.dt_txt, 'yyyy-MM-dd HH:mm:ss', { zone: 'UTC' })
      .setZone('Asia/Taipei');
    const label = `${tw.toFormat('MM/dd')} ${tw.hour === 12 ? '午' : '夜'}`;

    const main = data.weather?.[0]?.main || '';
    const desc = data.weather?.[0]?.description || '';
    const pop = Math.round((data.pop || 0) * 100);

    let emoji = '⛅';
    if (pop >= 60) emoji = '🌧️';
    else if (pop >= 30) emoji = '🌦️';
    else if (main === 'Clear') emoji = '☀️';
    else if (main === 'Clouds') emoji = '☁️';
    else if (main === 'Thunderstorm') emoji = '⛈️';
    else if (main === 'Snow') emoji = '❄️';

    const temp = data.main.temp.toFixed(0);
    const wind = data.wind?.speed?.toFixed(0) ?? '0';

    return `${label} ${emoji}${temp}° ☔${pop}% 🍃${wind}`;
  });

  const line = `**${loc.name}** ${slotLines.join(' / ')}`;
  if (groups[loc.region]) groups[loc.region].push(line);
}

// 每區域產一則訊息
const out = [];
const updateAt = DateTime.now().setZone('Asia/Taipei').toFormat('MM/dd HH:mm');

for (const [region, lines] of Object.entries(groups)) {
  if (lines.length === 0) continue;

  const header = `📊 **TCU 天氣週報 — ${REGION_LABEL[region]}**`;
  const footer = `🕒 ${updateAt}`;
  let msg = [header, '═'.repeat(20), ...lines, '', footer].join('\n');

  if (msg.length > 1900) msg = msg.slice(0, 1900) + '\n…(已截斷)';
  out.push({ json: { weatherMessage: msg, region } });
}

return out;

import { addWeeks, addMonths, format, setDay, setDate as setDateOfMonth } from 'date-fns'

/**
 * 依頻率、指定的星期/日期與期數，產生所有定期日期。
 *
 * - weekly + weekday：從起始日期找到最近的指定星期幾（含當天），再逐週遞增
 * - monthly + dayOfMonth：從起始日期找到最近的指定幾號（含當月），再逐月遞增
 *   月底溢出由 date-fns addMonths 自動處理（如 1/31 → 2/28）
 *
 * @param 起始日期 YYYY-MM-DD 格式
 * @param 頻率 'weekly' | 'monthly'
 * @param 期數 2–12
 * @param 星期幾 0（日）–6（六），僅 weekly 使用
 * @param 幾號 1–31，僅 monthly 使用
 * @returns YYYY-MM-DD 字串陣列，長度等於期數
 */
export function 產生定期日期(
  起始日期: string,
  頻率: 'weekly' | 'monthly',
  期數: number,
  星期幾?: number,
  幾號?: number
): string[] {
  const 基準 = new Date(起始日期 + 'T00:00:00')
  const 結果: string[] = []

  if (頻率 === 'weekly') {
    // 找到起始日期當週或下週的指定星期幾
    const 目標星期 = 星期幾 ?? 基準.getDay()
    let 第一期 = setDay(基準, 目標星期, { weekStartsOn: 0 })
    // 若算出的日期比起始日期早，往後推一週
    if (第一期 < 基準) 第一期 = addWeeks(第一期, 1)

    for (let i = 0; i < 期數; i++) {
      結果.push(format(addWeeks(第一期, i), 'yyyy-MM-dd'))
    }
  } else {
    // monthly：找到起始日期當月或下月的指定幾號
    const 目標日 = 幾號 ?? 基準.getDate()
    let 第一期 = setDateOfMonth(基準, 目標日)
    // 若算出的日期比起始日期早，往後推一個月
    if (第一期 < 基準) 第一期 = addMonths(第一期, 1)

    for (let i = 0; i < 期數; i++) {
      const 日期 = addMonths(第一期, i)
      // 處理目標日超過該月天數的情況（如 31 號 → 2 月只有 28 天）
      const 實際日 = setDateOfMonth(日期, Math.min(目標日, new Date(日期.getFullYear(), 日期.getMonth() + 1, 0).getDate()))
      結果.push(format(實際日, 'yyyy-MM-dd'))
    }
  }

  return 結果
}

/**
 * 將 YYYY-MM-DD 格式日期轉為中文星期顯示（如「（四）」）
 */
export function 取得星期顯示(日期字串: string): string {
  const 星期對照 = ['（日）', '（一）', '（二）', '（三）', '（四）', '（五）', '（六）']
  const d = new Date(日期字串 + 'T00:00:00')
  return 星期對照[d.getDay()]
}

/** 星期選項，供 UI select 使用 */
export const 星期選項 = [
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
  { value: 0, label: '日' },
] as const

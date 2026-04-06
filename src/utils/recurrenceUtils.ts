import { addWeeks, addMonths, format } from 'date-fns'

/**
 * 依起始日期、頻率與期數，產生所有定期日期（含第一期）。
 * 每月週期使用 date-fns addMonths，自動處理月底溢出（如 1/31 → 2/28）。
 *
 * @param 起始日期 YYYY-MM-DD 格式
 * @param 頻率 'weekly' | 'monthly'
 * @param 期數 2–12
 * @returns YYYY-MM-DD 字串陣列，長度等於期數
 */
export function 產生定期日期(
  起始日期: string,
  頻率: 'weekly' | 'monthly',
  期數: number
): string[] {
  const 基準 = new Date(起始日期 + 'T00:00:00')
  const 結果: string[] = []

  for (let i = 0; i < 期數; i++) {
    const 日期 = 頻率 === 'weekly'
      ? addWeeks(基準, i)
      : addMonths(基準, i)
    結果.push(format(日期, 'yyyy-MM-dd'))
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

// 统计 API：调用数据库函数聚合，避免把全部账单拉到前端
import { supabase } from './supabase'

/**
 * 获取并聚合统计数据
 * 返回：总收支、分类汇总（支出/收入）、月度趋势、账单数、实际数据区间
 * @param {{ startDate?: string|null, endDate?: string|null }} range
 */
export async function fetchStats({ startDate = null, endDate = null } = {}) {
  const { data, error } = await supabase.rpc('get_bill_stats', {
    p_start_date: startDate,
    p_end_date: endDate,
  })

  if (error) throw error
  return data
}

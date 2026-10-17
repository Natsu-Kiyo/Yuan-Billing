// 账单相关 API：CRUD、分页查询、统计、获取全部账单
import { supabase } from './supabase'

/** 分页查询账单列表，支持按类型、分类、日期范围、金额范围筛选 */
export async function fetchBills({ userId, type, categoryId, startDate, endDate, minAmount, maxAmount, page = 1, pageSize = 10 }) {
  let query = supabase
    .from('bills')
    .select('*, categories(name, icon, color)', { count: 'exact' })
    .eq('user_id', userId)
    .order('bill_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (type && type !== 'all') {
    query = query.eq('type', type)
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  if (startDate) {
    query = query.gte('bill_date', startDate)
  }

  if (endDate) {
    query = query.lte('bill_date', endDate)
  }

  if (minAmount != null) {
    query = query.gte('amount', minAmount)
  }

  if (maxAmount != null) {
    query = query.lte('amount', maxAmount)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query.range(from, to)

  if (error) throw error
  return { data, total: count }
}

/** 创建一条新账单记录 */
export async function createBill(data) {
  const { data: result, error } = await supabase
    .from('bills')
    .insert(data)
    .select('*, categories(name, icon, color)')
    .single()

  if (error) throw error
  return result
}

/** 批量创建账单（CSV 导入使用） */
export async function createBills(rows) {
  if (!rows?.length) return

  const { error } = await supabase
    .from('bills')
    .insert(rows)

  if (error) throw error
}

/** 更新指定账单 */
export async function updateBill(id, data) {
  const { data: result, error } = await supabase
    .from('bills')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, categories(name, icon, color)')
    .single()

  if (error) throw error
  return result
}

/** 删除指定账单 */
export async function deleteBill(id) {
  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/** 获取时间范围内的账单统计数据（用于图表分析） */
export async function getStats({ userId, startDate, endDate }) {
  let query = supabase
    .from('bills')
    .select('type, amount, category_id, bill_date, categories(name, icon, color)')
    .eq('user_id', userId)

  if (startDate) {
    query = query.gte('bill_date', startDate)
  }

  if (endDate) {
    query = query.lte('bill_date', endDate)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

/** 获取最近 N 条账单（首页仪表盘使用） */
export async function getRecentBills({ userId, limit = 5 }) {
  const { data, error } = await supabase
    .from('bills')
    .select('*, categories(name, icon, color)')
    .eq('user_id', userId)
    .order('bill_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

/** 获取用户的全部账单（用于 CSV 导出） */
export async function fetchAllBills(userId) {
  const { data, error } = await supabase
    .from('bills')
    .select('*, categories(name, icon, color)')
    .eq('user_id', userId)
    .order('bill_date', { ascending: false })

  if (error) throw error
  return data
}
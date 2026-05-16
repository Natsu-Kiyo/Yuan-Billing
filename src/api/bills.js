import { supabase } from './supabase'

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

export async function getBillById(id) {
  const { data, error } = await supabase
    .from('bills')
    .select('*, categories(name, icon, color)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createBill(data) {
  const { data: result, error } = await supabase
    .from('bills')
    .insert(data)
    .select('*, categories(name, icon, color)')
    .single()

  if (error) throw error
  return result
}

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

export async function deleteBill(id) {
  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getStats({ userId, startDate, endDate }) {
  const { data, error } = await supabase
    .from('bills')
    .select('type, amount, category_id, bill_date, categories(name, icon, color)')
    .eq('user_id', userId)
    .gte('bill_date', startDate)
    .lte('bill_date', endDate)

  if (error) throw error
  return data
}

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

export async function fetchAllBills(userId) {
  const { data, error } = await supabase
    .from('bills')
    .select('*, categories(name, icon, color)')
    .eq('user_id', userId)
    .order('bill_date', { ascending: false })

  if (error) throw error
  return data
}
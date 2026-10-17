// 分类 API：获取全部分类列表
import { supabase } from './supabase'

/** 获取全部分类，按 sort_order 升序排列 */
export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

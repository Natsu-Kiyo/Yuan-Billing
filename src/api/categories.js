import { supabase } from './supabase'

export async function fetchCategories(userId) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`is_default.eq.true,user_id.eq.${userId}`)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

export async function createCategory(data) {
  const { data: result, error } = await supabase
    .from('categories')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return result
}

export async function updateCategory(id, data) {
  const { data: result, error } = await supabase
    .from('categories')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return result
}

export async function deleteCategory(id) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}
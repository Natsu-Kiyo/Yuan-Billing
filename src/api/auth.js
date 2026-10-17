// 认证相关 API：注册、登录、登出、会话管理、用户信息、头像上传
import { supabase } from './supabase'

/** 用户注册（邮箱 + 密码），同时写入昵称到 profiles 表 */
export async function signUp({ email, password, nickname }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nickname },
    },
  })

  if (error) throw error

  // 注册成功后同步更新 profiles 表中的昵称
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ nickname })
      .eq('id', data.user.id)

    if (profileError) throw profileError
  }

  return data
}

/** 邮箱密码登录 */
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

/** 登出当前用户 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/** 获取当前会话 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

/** 获取当前已登录用户信息 */
export async function getUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

/** 根据 userId 查询 profiles 表获取用户资料（资料缺失时返回 null，不影响登录） */
export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()

  if (error) throw error
  return data
}

/** 更新指定用户的 profiles 表记录，资料行缺失时自动补建 */
export async function updateProfile(userId, updates) {
  const payload = { ...updates, updated_at: new Date().toISOString() }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select()
    .maybeSingle()

  if (error) throw error
  if (data) return data

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({ id: userId, ...payload })
    .select()
    .maybeSingle()

  if (insertError) throw insertError
  return created
}

/** 监听认证状态变化（登录/登出/Token 刷新） */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

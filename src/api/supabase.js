// Supabase 客户端初始化（单例）
import { createClient } from '@supabase/supabase-js'
import { assertEnv, renderEnvError } from '@/utils/env'

try {
  assertEnv()
} catch (err) {
  renderEnvError(err.message)
  throw err
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 创建共享的 Supabase 客户端实例，启用自动刷新和会话持久化
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

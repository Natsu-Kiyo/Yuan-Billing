// 认证状态管理：用户登录/注册/登出、会话持久化、profile 管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signIn as apiSignIn,
  signUp as apiSignUp,
  signOut as apiSignOut,
  getSession,
  getUser,
  getProfile,
  updateProfile as apiUpdateProfile,
  onAuthStateChange,
} from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // 核心状态
  const user = ref(null)
  const profile = ref(null)
  const session = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const initialized = ref(false) // 标识 initAuth 是否已完成

  // 计算属性
  const isLoggedIn = computed(() => !!user.value && !!session.value)
  const userId = computed(() => user.value?.id || null)

  /** 初始化认证状态：恢复 Supabase 本地持久化会话 */
  async function initAuth() {
    loading.value = true
    error.value = null

    try {
      const currentSession = await getSession()
      if (currentSession) {
        session.value = currentSession
        const currentUser = await getUser()
        user.value = currentUser
        const userProfile = await getProfile(currentUser.id)
        profile.value = userProfile
      }
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
      initialized.value = true
    }

    // 注册全局认证状态监听（登录/登出/Token 刷新自动同步）
    onAuthStateChange(async (event, newSession) => {
      session.value = newSession

      if (newSession?.user) {
        user.value = newSession.user
        try {
          const userProfile = await getProfile(newSession.user.id)
          profile.value = userProfile
        } catch {
          profile.value = null
        }
      } else {
        user.value = null
        profile.value = null
      }
    })
  }

  /** 邮箱密码登录 */
  async function login({ email, password }) {
    loading.value = true
    error.value = null

    try {
      const data = await apiSignIn({ email, password })
      user.value = data.user
      session.value = data.session
      const userProfile = await getProfile(data.user.id)
      profile.value = userProfile
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 邮箱密码注册 */
  async function register({ email, password, nickname }) {
    loading.value = true
    error.value = null

    try {
      const data = await apiSignUp({ email, password, nickname })
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 登出并清空本地状态 */
  async function logout() {
    loading.value = true
    error.value = null

    try {
      await apiSignOut()
      user.value = null
      profile.value = null
      session.value = null
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 更新当前用户 profile */
  async function updateProfile(updates) {
    loading.value = true
    error.value = null

    try {
      const updated = await apiUpdateProfile(userId.value, updates)
      profile.value = updated
      return updated
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    profile,
    session,
    loading,
    error,
    initialized,
    isLoggedIn,
    userId,
    initAuth,
    login,
    register,
    logout,
    updateProfile,
  }
})

import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const authStore = useAuthStore()
  const { user, userId, profile, isLoggedIn, loading, error } = storeToRefs(authStore)

  return {
    user,
    userId,
    profile,
    isLoggedIn,
    loading,
    error,
    login: authStore.login,
    register: authStore.register,
    logout: authStore.logout,
    updateProfile: authStore.updateProfile,
    initAuth: authStore.initAuth,
  }
}
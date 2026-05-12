import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const authStore = useAuthStore()

  return {
    user: authStore.user,
    profile: authStore.profile,
    isLoggedIn: authStore.isLoggedIn,
    loading: authStore.loading,
    error: authStore.error,
    login: authStore.login,
    register: authStore.register,
    logout: authStore.logout,
    updateProfile: authStore.updateProfile,
    initAuth: authStore.initAuth,
  }
}
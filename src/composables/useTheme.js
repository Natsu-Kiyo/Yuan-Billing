import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/theme'

export function useTheme() {
  const themeStore = useThemeStore()
  const { isDark } = storeToRefs(themeStore)

  return {
    isDark,
    toggleTheme: themeStore.toggleTheme,
    initTheme: themeStore.initTheme,
  }
}
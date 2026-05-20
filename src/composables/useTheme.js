// 主题组合式函数：对 useThemeStore 的响应式封装
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
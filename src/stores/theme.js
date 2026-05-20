// 主题状态管理：亮/暗模式切换、本地持久化、系统偏好检测
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  /** 初始化主题：localStorage → 系统偏好 → 默认亮色 */
  function initTheme() {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      isDark.value = true
    } else if (saved === 'light') {
      isDark.value = false
    } else {
      // 无缓存时跟随系统偏好
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme()
  }

  /** 切换主题：亮 ↔ 暗 */
  function toggleTheme() {
    isDark.value = !isDark.value
    applyTheme()
  }

  /** 将主题应用到 document 并写入 localStorage */
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  // 状态变化自动同步到 DOM
  watch(isDark, () => {
    applyTheme()
  })

  return {
    isDark,
    initTheme,
    toggleTheme,
  }
})
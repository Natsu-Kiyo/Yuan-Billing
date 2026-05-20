// 图表主题组合式函数：从 CSS 变量读取 ECharts 配色，并随主题切换联动更新
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

/** 读取 CSS 自定义属性值（如 --color-bg-card） */
function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function useChartTheme() {
  const { isDark } = useTheme()

  // void isDark.value 用于建立与 isDark 的响应式依赖，确保主题切换时 CSS 变量重新读取
  const bgCard = computed(() => {
    void isDark.value
    return getCssVar('--color-bg-card')
  })

  const borderColor = computed(() => {
    void isDark.value
    return getCssVar('--color-border')
  })

  const textPrimary = computed(() => {
    void isDark.value
    return getCssVar('--color-text-primary')
  })

  const textSecondary = computed(() => {
    void isDark.value
    return getCssVar('--color-text-secondary')
  })

  return { bgCard, borderColor, textPrimary, textSecondary }
}
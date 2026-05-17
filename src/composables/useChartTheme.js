import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function useChartTheme() {
  const { isDark } = useTheme()

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
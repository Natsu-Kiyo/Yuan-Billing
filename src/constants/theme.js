// 与 src/assets/styles/variables.less 中的 CSS 变量保持一致，供 JS/ECharts 使用
export const THEME_COLORS = {
  brand: '#6366f1',
  expense: '#ef4444',
  income: '#10b981',
  warning: '#f59e0b',
}

/** 将十六进制颜色转为带透明度的 rgba，用于图表渐变 */
export function withAlpha(hex, alpha) {
  const value = String(hex).replace('#', '')
  const normalized =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value

  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

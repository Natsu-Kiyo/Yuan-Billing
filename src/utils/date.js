/** 计算两个 YYYY-MM-DD 之间的天数（含首尾），用 UTC 避免时区偏移 */
export function countDays(start, end) {
  if (!start || !end) return 0

  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const startMs = Date.UTC(sy, sm - 1, sd)
  const endMs = Date.UTC(ey, em - 1, ed)

  if ([startMs, endMs].some(Number.isNaN) || endMs < startMs) return 0

  return Math.round((endMs - startMs) / 86400000) + 1
}

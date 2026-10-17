import { describe, it, expect } from 'vitest'
import { countDays } from './date'

describe('countDays', () => {
  it('统计含首尾的天数', () => {
    expect(countDays('2026-10-01', '2026-10-31')).toBe(31)
    expect(countDays('2026-10-17', '2026-10-17')).toBe(1)
  })

  it('跨月、跨年正确', () => {
    expect(countDays('2026-01-31', '2026-02-01')).toBe(2)
    expect(countDays('2025-12-31', '2026-01-01')).toBe(2)
    expect(countDays('2024-02-28', '2024-03-01')).toBe(3)
  })

  it('非法输入返回 0', () => {
    expect(countDays('', '2026-10-01')).toBe(0)
    expect(countDays('2026-10-01', null)).toBe(0)
    expect(countDays('2026-10-31', '2026-10-01')).toBe(0)
    expect(countDays('not-a-date', '2026-10-01')).toBe(0)
  })
})

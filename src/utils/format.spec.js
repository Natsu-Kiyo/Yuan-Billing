import { describe, it, expect } from 'vitest'
import { formatAmount, sanitizeAmount, formatDate, formatDateShort } from './format'

describe('formatAmount', () => {
  it('格式化千分位并保留两位小数', () => {
    expect(formatAmount(1234.5)).toBe('¥1,234.50')
    expect(formatAmount('1000')).toBe('¥1,000.00')
    expect(formatAmount(0)).toBe('¥0.00')
  })

  it('非法输入回退为 0', () => {
    expect(formatAmount('abc')).toBe('¥0.00')
  })
})

describe('sanitizeAmount', () => {
  it.each([
    ['-e+', ''],
    ['e', ''],
    ['12e5', '125'],
    ['1.2.3', '1.23'],
    ['12.345', '12.34'],
    ['.5', '.5'],
    ['00.5', '0.5'],
    ['0.05', '0.05'],
    ['007', '7'],
    ['abc12.5def', '12.5'],
    ['1.', '1.'],
    ['', ''],
  ])('%s -> %s', (input, expected) => {
    expect(sanitizeAmount(input)).toBe(expected)
  })
})

describe('formatDate', () => {
  it('直接截取 YYYY-MM-DD，不受时区影响', () => {
    expect(formatDate('2026-01-05')).toBe('2026-01-05')
    expect(formatDate('2026-01-05T23:00:00Z')).toBe('2026-01-05')
  })

  it('支持 Date 对象', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('空值返回空字符串', () => {
    expect(formatDate('')).toBe('')
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })
})

describe('formatDateShort', () => {
  it('输出 MM/DD', () => {
    expect(formatDateShort('2026-10-17')).toBe('10/17')
    expect(formatDateShort('')).toBe('')
  })
})

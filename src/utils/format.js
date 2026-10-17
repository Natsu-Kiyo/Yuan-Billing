// 格式化工具函数：金额、日期、月份范围、今天
/** 金额格式化为 ¥1,000.00 形式（千分位逗号分隔） */
export function formatAmount(amount) {
  const num = Number(amount)
  if (isNaN(num)) return '¥0.00'
  return '¥' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 金额输入过滤：仅保留数字与最多一个小数点，且小数最多两位
 * 例如 "-e+" -> ""，"1.2.3" -> "1.23"，"12.345" -> "12.34"
 */
export function sanitizeAmount(raw) {
  let val = String(raw ?? '').replace(/[^\d.]/g, '')

  const dotIndex = val.indexOf('.')
  if (dotIndex !== -1) {
    val =
      val.slice(0, dotIndex + 1) +
      val.slice(dotIndex + 1).replace(/\./g, '')
    const [intPart, decPart] = val.split('.')
    val = `${intPart}.${decPart.slice(0, 2)}`
  }

  // 去掉多余的前导 0（保留 "0.xx" 中的 0）
  return val.replace(/^0+(?=\d)/, '')
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

/**
 * 解析日期为年/月/日三部分
 * YYYY-MM-DD 字符串直接截取，避免 new Date 按 UTC 解析导致时区偏移（差一天）
 */
function parseDateParts(value) {
  if (!value) return null

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      return { year: match[1], month: match[2], day: match[3] }
    }
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return {
    year: String(date.getFullYear()),
    month: pad2(date.getMonth() + 1),
    day: pad2(date.getDate()),
  }
}

/** 日期格式化为 YYYY-MM-DD */
export function formatDate(dateStr) {
  const parts = parseDateParts(dateStr)
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : ''
}

/** 日期格式化为 MM/DD（短格式） */
export function formatDateShort(dateStr) {
  const parts = parseDateParts(dateStr)
  return parts ? `${parts.month}/${parts.day}` : ''
}

/** 获取当前月份的起止日期范围 */
export function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  }
}

/** 获取今天的日期字符串（YYYY-MM-DD） */
export function getToday() {
  return formatDate(new Date())
}
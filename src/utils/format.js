// 格式化工具函数：金额、日期、月份范围、今天
/** 金额格式化为 ¥1,000.00 形式（千分位逗号分隔） */
export function formatAmount(amount) {
  const num = Number(amount)
  if (isNaN(num)) return '¥0.00'
  return '¥' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** 日期字符串格式化为 YYYY-MM-DD */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 日期字符串格式化为 MM/DD（短格式） */
export function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}/${day}`
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
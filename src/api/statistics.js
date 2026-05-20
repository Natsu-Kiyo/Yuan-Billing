// 统计 API：聚合账单原始数据为图表可用的结构化统计数据
import { getStats as apiGetStats } from './bills'

/** 
 * 获取并聚合统计数据
 * 返回：总收支、分类汇总（支出/收入）、月度趋势、账单总数
 */
export async function fetchStats({ userId, startDate, endDate }) {
  const rawData = await apiGetStats({ userId, startDate, endDate })

  const expenseByCategory = {}
  const incomeByCategory = {}
  const monthlyMap = {}
  let totalExpense = 0
  let totalIncome = 0

  rawData.forEach((item) => {
    const amount = Number(item.amount)
    const month = item.bill_date?.substring(0, 7) // 提取 YYYY-MM
    const catName = item.categories?.name || '未分类'
    const catColor = item.categories?.color || '#6366f1'

    if (item.type === 'expense') {
      totalExpense += amount
      if (!expenseByCategory[catName]) {
        expenseByCategory[catName] = { name: catName, value: 0, color: catColor }
      }
      expenseByCategory[catName].value += amount
    } else {
      totalIncome += amount
      if (!incomeByCategory[catName]) {
        incomeByCategory[catName] = { name: catName, value: 0, color: catColor }
      }
      incomeByCategory[catName].value += amount
    }

    // 按月度累计收支
    if (month) {
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, expense: 0, income: 0 }
      }
      if (item.type === 'expense') {
        monthlyMap[month].expense += amount
      } else {
        monthlyMap[month].income += amount
      }
    }
  })

  // 转换为数组并排序
  const expenseList = Object.values(expenseByCategory).sort((a, b) => b.value - a.value)
  const incomeList = Object.values(incomeByCategory).sort((a, b) => b.value - a.value)
  const monthlyTrend = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month))

  return {
    totalExpense,
    totalIncome,
    balance: totalIncome - totalExpense,
    expenseByCategory: expenseList,
    incomeByCategory: incomeList,
    monthlyTrend,
    billCount: rawData.length,
  }
}
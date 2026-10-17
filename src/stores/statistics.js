// 统计状态管理：获取统计数据、管理时间范围筛选、派生指标计算
import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { fetchStats as apiFetchStats } from '@/api/statistics'

/** 计算两个 YYYY-MM-DD 之间的天数（含首尾），用 UTC 避免时区偏移 */
function countDays(start, end) {
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const startMs = Date.UTC(sy, sm - 1, sd)
  const endMs = Date.UTC(ey, em - 1, ed)
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) return 0
  return Math.round((endMs - startMs) / 86400000) + 1
}

export const useStatisticsStore = defineStore('statistics', () => {
  const stats = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // 默认无日期限制，显示全部数据
  const dateRange = reactive({
    startDate: null,
    endDate: null,
  })

  // 派生指标（从 stats 中解构）
  const totalExpense = computed(() => stats.value?.totalExpense || 0)
  const totalIncome = computed(() => stats.value?.totalIncome || 0)
  const balance = computed(() => stats.value?.balance || 0)
  const billCount = computed(() => stats.value?.billCount || 0)
  const expenseByCategory = computed(() => stats.value?.expenseByCategory || [])
  const incomeByCategory = computed(() => stats.value?.incomeByCategory || [])
  const monthlyTrend = computed(() => stats.value?.monthlyTrend || [])

  // 日均支出 = 总支出 / 统计天数（优先用所选范围，未选择时用账单实际覆盖的区间）
  const averageDailyExpense = computed(() => {
    if (!stats.value) return 0

    const start = dateRange.startDate || stats.value.dataStartDate
    const end = dateRange.endDate || stats.value.dataEndDate
    if (!start || !end) return 0

    const days = countDays(start, end)
    if (!days) return 0

    return totalExpense.value / days
  })

  /** 拉取并聚合统计数据 */
  async function fetchStats(userId) {
    loading.value = true
    error.value = null

    try {
      const data = await apiFetchStats({
        userId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })
      stats.value = data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /** 设置统计时间范围 */
  function setDateRange(start, end) {
    dateRange.startDate = start
    dateRange.endDate = end
  }

  return {
    stats,
    loading,
    error,
    dateRange,
    totalExpense,
    totalIncome,
    balance,
    billCount,
    expenseByCategory,
    incomeByCategory,
    monthlyTrend,
    averageDailyExpense,
    fetchStats,
    setDateRange,
  }
})
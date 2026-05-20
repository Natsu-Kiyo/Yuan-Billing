// 统计状态管理：获取统计数据、管理时间范围筛选、派生指标计算
import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { fetchStats as apiFetchStats } from '@/api/statistics'

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

  // 日均支出 = 总支出 / 统计天数
  const averageDailyExpense = computed(() => {
    if (!stats.value || !dateRange.startDate || !dateRange.endDate) return 0
    const start = new Date(dateRange.startDate)
    const end = new Date(dateRange.endDate)
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1)
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
import { storeToRefs } from 'pinia'
import { useStatisticsStore } from '@/stores/statistics'

export function useStatistics() {
  const store = useStatisticsStore()
  const {
    stats, loading, error, dateRange,
    totalExpense, totalIncome, balance, billCount,
    expenseByCategory, incomeByCategory, monthlyTrend, averageDailyExpense,
  } = storeToRefs(store)

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
    fetchStats: store.fetchStats,
    setDateRange: store.setDateRange,
  }
}
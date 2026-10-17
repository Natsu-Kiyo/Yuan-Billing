// 账单组合式函数：组合 useBillsStore + useCategoriesStore 的统一封装
import { storeToRefs } from 'pinia'
import { useBillsStore } from '@/stores/bills'
import { useCategoriesStore } from '@/stores/categories'

export function useBills() {
  const billsStore = useBillsStore()
  const categoriesStore = useCategoriesStore()

  const {
    bills,
    loading,
    error,
    filters,
    pagination,
    totalIncome,
    totalExpense,
    balance,
    currentBill,
  } = storeToRefs(billsStore)

  const { categories, expenseCategories, incomeCategories, categoryMap } =
    storeToRefs(categoriesStore)

  return {
    bills,
    loading,
    error,
    filters,
    pagination,
    totalIncome,
    totalExpense,
    balance,
    currentBill,
    categories,
    expenseCategories,
    incomeCategories,
    categoryMap,
    fetchBills: billsStore.fetchBills,
    addBill: billsStore.addBill,
    editBill: billsStore.editBill,
    removeBill: billsStore.removeBill,
    setFilters: billsStore.setFilters,
    setPage: billsStore.setPage,
    setCurrentBill: billsStore.setCurrentBill,
    fetchStats: billsStore.fetchStats,
    fetchRecentBills: billsStore.fetchRecentBills,
    fetchCategories: categoriesStore.fetchCategories,
  }
}

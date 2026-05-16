import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import {
  fetchBills as apiFetchBills,
  createBill as apiCreateBill,
  updateBill as apiUpdateBill,
  deleteBill as apiDeleteBill,
  getStats as apiGetStats,
  getRecentBills as apiGetRecentBills,
} from '@/api/bills'

export const useBillsStore = defineStore('bills', () => {
  const bills = ref([])
  const currentBill = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const filters = reactive({
    type: 'all',
    categoryId: null,
    startDate: null,
    endDate: null,
    minAmount: null,
    maxAmount: null,
  })

  const pagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0,
  })

  const totalIncome = computed(() =>
    bills.value
      .filter((b) => b.type === 'income')
      .reduce((sum, b) => sum + Number(b.amount), 0)
  )

  const totalExpense = computed(() =>
    bills.value
      .filter((b) => b.type === 'expense')
      .reduce((sum, b) => sum + Number(b.amount), 0)
  )

  const balance = computed(() => totalIncome.value - totalExpense.value)

  async function fetchBills(userId) {
    loading.value = true
    error.value = null

    try {
      const { data, total } = await apiFetchBills({
        userId,
        type: filters.type,
        categoryId: filters.categoryId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
        page: pagination.page,
        pageSize: pagination.pageSize,
      })
      bills.value = data
      pagination.total = total
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addBill(data) {
    const result = await apiCreateBill(data)
    return result
  }

  async function editBill(id, data) {
    const result = await apiUpdateBill(id, data)
    const index = bills.value.findIndex((b) => b.id === id)
    if (index !== -1) {
      bills.value[index] = result
    }
    return result
  }

  async function removeBill(id) {
    await apiDeleteBill(id)
    bills.value = bills.value.filter((b) => b.id !== id)
  }

  function setFilters(newFilters) {
    Object.assign(filters, newFilters)
    pagination.page = 1
  }

  function setPage(page) {
    pagination.page = page
  }

  function setCurrentBill(bill) {
    currentBill.value = bill
  }

  async function fetchStats(userId, startDate, endDate) {
    return await apiGetStats({ userId, startDate, endDate })
  }

  async function fetchRecentBills(userId, limit = 5) {
    return await apiGetRecentBills({ userId, limit })
  }

  return {
    bills,
    currentBill,
    loading,
    error,
    filters,
    pagination,
    totalIncome,
    totalExpense,
    balance,
    fetchBills,
    addBill,
    editBill,
    removeBill,
    setFilters,
    setPage,
    setCurrentBill,
    fetchStats,
    fetchRecentBills,
  }
})
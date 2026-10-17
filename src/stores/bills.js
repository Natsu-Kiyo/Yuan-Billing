// 账单状态管理：分页查询、筛选、增删改、收支汇总
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

  // 筛选条件（响应式对象，修改后自动触发重新查询）
  const filters = reactive({
    type: 'all',
    categoryId: null,
    startDate: null,
    endDate: null,
    minAmount: null,
    maxAmount: null,
  })

  // 分页状态
  const pagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0,
  })

  // 基于当前列表实时计算的收支汇总
  const totalIncome = computed(() =>
    bills.value.filter((b) => b.type === 'income').reduce((sum, b) => sum + Number(b.amount), 0),
  )

  const totalExpense = computed(() =>
    bills.value.filter((b) => b.type === 'expense').reduce((sum, b) => sum + Number(b.amount), 0),
  )

  const balance = computed(() => totalIncome.value - totalExpense.value)

  // 请求序号：快速切换筛选时只接受最后一次请求的结果
  let requestSeq = 0

  /** 按当前筛选条件和分页参数查询账单 */
  async function fetchBills(userId) {
    const seq = ++requestSeq
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
      // 过期响应直接丢弃，避免覆盖最新筛选结果
      if (seq !== requestSeq) return

      bills.value = data
      pagination.total = total
    } catch (err) {
      if (seq !== requestSeq) return
      error.value = err.message
      throw err
    } finally {
      if (seq === requestSeq) {
        loading.value = false
      }
    }
  }

  /** 新增账单（不更新本地列表，由调用方刷新） */
  async function addBill(data) {
    const result = await apiCreateBill(data)
    return result
  }

  /** 编辑账单，同时更新本地列表中对应项 */
  async function editBill(id, data) {
    const result = await apiUpdateBill(id, data)
    const index = bills.value.findIndex((b) => b.id === id)
    if (index !== -1) {
      bills.value[index] = result
    }
    return result
  }

  /** 删除账单并从本地列表中移除，同时同步分页状态 */
  async function removeBill(id) {
    await apiDeleteBill(id)
    const beforeCount = bills.value.length
    bills.value = bills.value.filter((b) => b.id !== id)

    if (bills.value.length !== beforeCount) {
      pagination.total = Math.max(0, pagination.total - 1)
    }

    // 删除当前页最后一条时回退一页，避免停留在空白页
    if (!bills.value.length && pagination.page > 1) {
      pagination.page -= 1
    }
  }

  /** 更新筛选条件（自动重置到第一页） */
  function setFilters(newFilters) {
    Object.assign(filters, newFilters)
    pagination.page = 1
  }

  /** 跳转页码 */
  function setPage(page) {
    pagination.page = page
  }

  /** 修改每页条数（自动回到第一页） */
  function setPageSize(size) {
    pagination.pageSize = size
    pagination.page = 1
  }

  /** 设置当前选中的账单（供编辑弹窗使用） */
  function setCurrentBill(bill) {
    currentBill.value = bill
  }

  /** 获取时间范围内的账单统计数据 */
  async function fetchStats(userId, startDate, endDate) {
    return await apiGetStats({ userId, startDate, endDate })
  }

  /** 获取最近 N 条账单 */
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
    setPageSize,
    setCurrentBill,
    fetchStats,
    fetchRecentBills,
  }
})

// 分类状态管理：获取全部分类、按类型筛选
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchCategories as apiFetchCategories } from '@/api/categories'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 按账单类型拆分分类（支出/收入）
  const expenseCategories = computed(() =>
    categories.value.filter((c) => c.type === 'expense')
  )

  const incomeCategories = computed(() =>
    categories.value.filter((c) => c.type === 'income')
  )

  // 快速查找映射（id → category 对象）
  const categoryMap = computed(() => {
    const map = {}
    categories.value.forEach((c) => {
      map[c.id] = c
    })
    return map
  })

  /** 获取全部分类（全局缓存，避免重复请求） */
  async function fetchCategories() {
    loading.value = true
    error.value = null

    try {
      const data = await apiFetchCategories()
      categories.value = data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    categories,
    loading,
    error,
    expenseCategories,
    incomeCategories,
    categoryMap,
    fetchCategories,
  }
})
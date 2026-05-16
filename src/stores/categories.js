import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchCategories as apiFetchCategories } from '@/api/categories'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)

  const expenseCategories = computed(() =>
    categories.value.filter((c) => c.type === 'expense')
  )

  const incomeCategories = computed(() =>
    categories.value.filter((c) => c.type === 'income')
  )

  const categoryMap = computed(() => {
    const map = {}
    categories.value.forEach((c) => {
      map[c.id] = c
    })
    return map
  })

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
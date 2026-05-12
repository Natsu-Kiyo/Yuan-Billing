<script setup>
import { ref, computed, watch } from 'vue'
import { useBills } from '@/composables/useBills'

const { filters, setFilters, expenseCategories, incomeCategories } = useBills()

const dateRange = ref(null)

watch(
  () => [filters.value.startDate, filters.value.endDate],
  ([start, end]) => {
    if (start && end) {
      dateRange.value = [start, end]
    } else {
      dateRange.value = null
    }
  },
  { immediate: true }
)

const currentCategories = computed(() => {
  if (filters.value.type === 'expense') return expenseCategories.value
  if (filters.value.type === 'income') return incomeCategories.value
  return [...expenseCategories.value, ...incomeCategories.value]
})

function handleTypeChange(type) {
  setFilters({ type, categoryId: null })
}

function handleCategoryChange(categoryId) {
  setFilters({ categoryId })
}

function handleDateChange(dates) {
  if (dates && dates.length === 2) {
    setFilters({ startDate: dates[0], endDate: dates[1] })
  } else {
    setFilters({ startDate: null, endDate: null })
  }
}
</script>

<template>
  <div class="bill-filter">
    <div class="filter-group">
      <el-radio-group
        :model-value="filters.type"
        size="small"
        @change="handleTypeChange"
      >
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="expense">支出</el-radio-button>
        <el-radio-button value="income">收入</el-radio-button>
      </el-radio-group>
    </div>

    <div class="filter-group">
      <el-select
        :model-value="filters.categoryId"
        placeholder="全部分类"
        clearable
        size="default"
        style="width: 140px"
        @change="handleCategoryChange"
      >
        <el-option
          v-for="cat in currentCategories"
          :key="cat.id"
          :label="cat.name"
          :value="cat.id"
        />
      </el-select>
    </div>

    <div class="filter-group">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        size="default"
        style="width: 240px"
        @change="handleDateChange"
      />
    </div>
  </div>
</template>

<style lang="less" scoped>
.bill-filter {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.filter-group {
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .bill-filter {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group :deep(.el-select),
  .filter-group :deep(.el-date-editor) {
    width: 100% !important;
  }
}
</style>
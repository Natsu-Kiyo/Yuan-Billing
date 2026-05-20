<script setup>
// 账单筛选栏：按类型 / 分类 / 日期范围 / 金额区间过滤
import { ref, computed, watch } from 'vue'
import { useBills } from '@/composables/useBills'

const { filters, setFilters, expenseCategories, incomeCategories } = useBills()

const dateRange = ref(null)
const startDate = ref(null)
const endDate = ref(null)
const minAmount = ref(null)
const maxAmount = ref(null)
const amountError = ref('')

let amountTimer = null

// 双向同步 store 中的日期筛选值到本地日期选择器
watch(
  () => [filters.value.startDate, filters.value.endDate],
  ([start, end]) => {
    if (start && end) {
      dateRange.value = [start, end]
    } else {
      dateRange.value = null
    }
    startDate.value = start || null
    endDate.value = end || null
  },
  { immediate: true }
)

// 双向同步 store 中的金额筛选值到本地输入框
watch(
  () => [filters.value.minAmount, filters.value.maxAmount],
  ([min, max]) => {
    if (minAmount.value !== min) minAmount.value = min
    if (maxAmount.value !== max) maxAmount.value = max
  },
  { immediate: true }
)

// 防抖 400ms 后校验金额区间合法性并更新筛选条件
watch([minAmount, maxAmount], () => {
  if (amountTimer) clearTimeout(amountTimer)
  amountTimer = setTimeout(() => {
    const min = minAmount.value !== '' && minAmount.value != null ? Number(minAmount.value) : null
    const max = maxAmount.value !== '' && maxAmount.value != null ? Number(maxAmount.value) : null

    if (min != null && max != null && max <= min) {
      amountError.value = '最高金额必须大于最低金额'
      return
    }

    amountError.value = ''
    if (filters.value.minAmount !== min || filters.value.maxAmount !== max) {
      setFilters({ minAmount: min, maxAmount: max })
    }
  }, 400)
})

// 根据当前选中的类型返回对应的分类列表
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

function handleDateChange() {
  setFilters({ startDate: startDate.value, endDate: endDate.value })
}

/** 禁用结束日期之前的所有日期（用于开始日期选择器） */
function disableStartDate(date) {
  return endDate.value ? date.getTime() > new Date(endDate.value).getTime() : false
}

/** 禁用开始日期之后的所有日期（用于结束日期选择器） */
function disableEndDate(date) {
  return startDate.value ? date.getTime() < new Date(startDate.value).getTime() : false
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

    <div class="filter-group date-group">
      <el-date-picker
        v-model="startDate"
        type="date"
        placeholder="开始日期"
        value-format="YYYY-MM-DD"
        size="default"
        style="width: 150px"
        :disabled-date="disableStartDate"
        @change="handleDateChange"
      />
      <span class="date-separator">至</span>
      <el-date-picker
        v-model="endDate"
        type="date"
        placeholder="结束日期"
        value-format="YYYY-MM-DD"
        size="default"
        style="width: 150px"
        :disabled-date="disableEndDate"
        @change="handleDateChange"
      />
    </div>

    <div class="filter-group amount-group">
      <el-input
        v-model="minAmount"
        placeholder="最低金额"
        type="number"
        size="default"
        style="width: 130px"
        clearable
      >
        <template #prefix>¥</template>
      </el-input>
      <span class="amount-separator">—</span>
      <el-input
        v-model="maxAmount"
        placeholder="最高金额"
        type="number"
        size="default"
        style="width: 130px"
        clearable
      >
        <template #prefix>¥</template>
      </el-input>
    </div>

    <div v-if="amountError" class="amount-error">{{ amountError }}</div>
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

.amount-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-separator {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.amount-separator {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.amount-error {
  font-size: var(--font-size-xs);
  color: var(--el-color-danger);
  margin-top: 4px;
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

  .date-group {
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .date-separator {
    display: none;
  }
}
</style>
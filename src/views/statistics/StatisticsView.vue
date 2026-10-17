<script setup>
// 统计分析页：日期范围筛选、收支概览、分类饼图、月度趋势图
import { ref, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useStatistics } from '@/composables/useStatistics'
import StatCard from '@/components/chart/StatCard.vue'
import { THEME_COLORS } from '@/constants/theme'

// 图表组件懒加载，减少首屏体积
const PieChart = defineAsyncComponent(() => import('@/components/chart/PieChart.vue'))
const LineChart = defineAsyncComponent(() => import('@/components/chart/LineChart.vue'))
const BarChart = defineAsyncComponent(() => import('@/components/chart/BarChart.vue'))

const { userId } = useAuth()
const {
  loading,
  dateRange,
  totalExpense,
  totalIncome,
  balance,
  expenseByCategory,
  incomeByCategory,
  monthlyTrend,
  averageDailyExpense,
  fetchStats,
  setDateRange,
} = useStatistics()

const startDateValue = ref(null)
const endDateValue = ref(null)
let debounceTimer = null

onMounted(async () => {
  if (!userId.value) return
  try {
    await fetchStats()
  } catch (err) {
    ElMessage.error(err.message || '加载统计数据失败')
  }
})

// 同步 store dateRange 到本地 UI 绑定值
watch(
  () => [dateRange.startDate, dateRange.endDate],
  () => {
    startDateValue.value = dateRange.startDate || null
    endDateValue.value = dateRange.endDate || null
  },
  { immediate: true }
)

/** 日期范围变化时防抖拉取统计（清空日期同样需要刷新回全量数据） */
function handleDateChange() {
  setDateRange(startDateValue.value, endDateValue.value)
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (userId.value) {
      fetchStats()
    }
  }, 300)
}

// 页面卸载时清理防抖定时器，避免卸载后仍发起请求
onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
})

/** 禁用结束日期之后的所有日期（用于开始日期选择器） */
function disableStartDate(date) {
  return endDateValue.value ? date.getTime() > new Date(endDateValue.value).getTime() : false
}

/** 禁用开始日期之前的所有日期（用于结束日期选择器） */
function disableEndDate(date) {
  return startDateValue.value ? date.getTime() < new Date(startDateValue.value).getTime() : false
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">数据统计</h1>
        <p class="page-subtitle">消费数据可视化分析</p>
      </div>
      <div class="date-filter">
        <el-date-picker
          v-model="startDateValue"
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
          v-model="endDateValue"
          type="date"
          placeholder="结束日期"
          value-format="YYYY-MM-DD"
          size="default"
          style="width: 150px"
          :disabled-date="disableEndDate"
          @change="handleDateChange"
        />
      </div>
    </div>

    <div class="stats-grid">
      <StatCard
        title="总支出"
        :value="totalExpense"
        prefix="¥"
        :color="THEME_COLORS.expense"
        :loading="loading"
      />
      <StatCard
        title="总收入"
        :value="totalIncome"
        prefix="¥"
        :color="THEME_COLORS.income"
        :loading="loading"
      />
      <StatCard
        title="结余"
        :value="balance"
        prefix="¥"
        :color="THEME_COLORS.brand"
        :loading="loading"
      />
      <StatCard
        title="日均支出"
        :value="averageDailyExpense"
        prefix="¥"
        :color="THEME_COLORS.warning"
        :loading="loading"
      />
    </div>

    <div class="charts-grid">
      <div class="section-card">
        <h3 class="chart-title">支出分类占比</h3>
        <PieChart :data="expenseByCategory" :loading="loading" />
      </div>
      <div class="section-card">
        <h3 class="chart-title">月度收支趋势</h3>
        <LineChart :data="monthlyTrend" :loading="loading" />
      </div>
    </div>

    <div class="charts-grid">
      <div class="section-card">
        <h3 class="chart-title">支出分类对比</h3>
        <BarChart :data="expenseByCategory" :loading="loading" />
      </div>
      <div class="section-card">
        <h3 class="chart-title">收入分类占比</h3>
        <PieChart :data="incomeByCategory" :loading="loading" />
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);

  > * {
    min-width: 0;
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);

  > * {
    min-width: 0;
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.section-card {
  overflow: hidden;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-separator {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .date-filter {
    flex-direction: column;
    width: 100%;
    gap: var(--spacing-xs);
  }

  .date-filter :deep(.el-date-editor) {
    width: 100% !important;
  }

  .date-separator {
    display: none;
  }
}
</style>
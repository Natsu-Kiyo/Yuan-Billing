<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useStatistics } from '@/composables/useStatistics'
import StatCard from '@/components/chart/StatCard.vue'
import PieChart from '@/components/chart/PieChart.vue'
import LineChart from '@/components/chart/LineChart.vue'
import BarChart from '@/components/chart/BarChart.vue'

const { userId } = useAuth()
const {
  loading,
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
} = useStatistics()

const dateRangeValue = ref(null)

onMounted(async () => {
  if (!userId.value) return
  await fetchStats(userId.value)
})

watch(
  () => [dateRange.startDate, dateRange.endDate],
  () => {
    if (dateRange.startDate && dateRange.endDate) {
      dateRangeValue.value = [dateRange.startDate, dateRange.endDate]
    }
  },
  { immediate: true }
)

function handleDateChange(val) {
  if (val && val.length === 2) {
    setDateRange(val[0], val[1])
    if (userId.value) {
      fetchStats(userId.value)
    }
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">数据统计</h1>
        <p class="page-subtitle">消费数据可视化分析</p>
      </div>
      <el-date-picker
        v-model="dateRangeValue"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        size="default"
        style="width: 260px"
        @change="handleDateChange"
      />
    </div>

    <div class="stats-grid">
      <StatCard
        title="总支出"
        :value="totalExpense"
        prefix="¥"
        color="#ef4444"
        :loading="loading"
      />
      <StatCard
        title="总收入"
        :value="totalIncome"
        prefix="¥"
        color="#22c55e"
        :loading="loading"
      />
      <StatCard
        title="结余"
        :value="balance"
        prefix="¥"
        color="#6366f1"
        :loading="loading"
      />
      <StatCard
        title="日均支出"
        :value="averageDailyExpense"
        prefix="¥"
        color="#f59e0b"
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

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md) 0;
}
</style>
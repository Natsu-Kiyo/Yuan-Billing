<script setup>
// 仪表盘首页：当日收支统计、热力图日历、最近账单、欢迎问候
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useBills } from '@/composables/useBills'
import { formatAmount, formatDate, getToday } from '@/utils/format'
import { getStats } from '@/api/bills'
import StatCard from '@/components/chart/StatCard.vue'
import {
  Top,
  Bottom,
  Wallet,
  Tickets,
  Food,
  Van,
  ShoppingCart,
  VideoPlay,
  Reading,
  House,
  FirstAidKit,
  More,
  Money,
  Coin,
  Present,
  MoreFilled,
} from '@element-plus/icons-vue'

const router = useRouter()
const { userId, profile } = useAuth()
const { fetchRecentBills } = useBills()

// 状态
const selectedDate = ref(getToday())
const dayStats = ref({ expense: 0, income: 0, balance: 0, count: 0 })
const monthBills = ref([])
const recentBills = ref([])
const loadingDay = ref(false)
const loadingMonth = ref(false)
const loadingBills = ref(false)

// 日历相关常量
const today = getToday()
const now = new Date()
const year = now.getFullYear()
const month = now.getMonth()
const daysInMonth = new Date(year, month + 1, 0).getDate()
const firstDayOfWeek = new Date(year, month, 1).getDay()

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

/** 构建热力图日历数据：按日汇总支出金额，计算颜色强度 */
const calendarData = computed(() => {
  const dailyMap = {}
  monthBills.value.forEach((b) => {
    const day = b.bill_date
    if (!dailyMap[day]) dailyMap[day] = 0
    if (b.type === 'expense') {
      dailyMap[day] += Number(b.amount)
    }
  })

  const maxAmount = Math.max(1, ...Object.values(dailyMap))

  const cells = []
  const startPadding = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  for (let i = 0; i < startPadding; i++) {
    cells.push(null)
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const amount = dailyMap[dateStr] || 0
    const intensity = amount > 0 ? Math.max(0.08, amount / maxAmount) : 0
    cells.push({ day: d, date: dateStr, amount, intensity })
  }

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return { weeks, maxAmount }
})

// 初始化数据
onMounted(async () => {
  if (!userId.value) return
  await Promise.all([fetchDayStats(), fetchMonthBills(), loadRecentBills()])
})

// 选中日期变化时重新拉取当日统计
watch(selectedDate, () => {
  if (userId.value) {
    fetchDayStats()
  }
})

/** 拉取选中日期的收支统计 */
async function fetchDayStats() {
  loadingDay.value = true
  try {
    const date = selectedDate.value
    const data = await getStats({ userId: userId.value, startDate: date, endDate: date })
    let expense = 0
    let income = 0
    data.forEach((b) => {
      if (b.type === 'expense') expense += Number(b.amount)
      else income += Number(b.amount)
    })
    dayStats.value = {
      expense,
      income,
      balance: income - expense,
      count: data.length,
    }
  } catch {
    dayStats.value = { expense: 0, income: 0, balance: 0, count: 0 }
  } finally {
    loadingDay.value = false
  }
}

/** 拉取当前整月的账单用于日历热力图 */
async function fetchMonthBills() {
  loadingMonth.value = true
  try {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
    monthBills.value = await getStats({ userId: userId.value, startDate, endDate })
  } catch {
    monthBills.value = []
  } finally {
    loadingMonth.value = false
  }
}

/** 拉取最近 5 条账单 */
async function loadRecentBills() {
  loadingBills.value = true
  try {
    recentBills.value = await fetchRecentBills(userId.value, 5)
  } catch {
    recentBills.value = []
  } finally {
    loadingBills.value = false
  }
}

// 分类名称 → 图标映射
const iconMap = {
  '餐饮': Food,
  '交通': Van,
  '购物': ShoppingCart,
  '娱乐': VideoPlay,
  '学习': Reading,
  '住房': House,
  '医疗': FirstAidKit,
  '其他支出': More,
  '工资': Money,
  '兼职': Coin,
  '生活费': Wallet,
  '红包': Present,
  '其他收入': MoreFilled,
}

function getCategoryIcon(categoryName) {
  return iconMap[categoryName] || Wallet
}

/** 根据当前小时返回问候语 */
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

/** 根据支出强度计算格子颜色 */
function cellColor(intensity) {
  if (intensity <= 0) return 'var(--color-bg-tertiary)'
  const r = 239
  const g = Math.round(68 + (1 - intensity) * 150)
  const b = Math.round(68 + (1 - intensity) * 150)
  return `rgb(${r}, ${g}, ${b})`
}

function formatTooltipAmount(amount) {
  if (amount === 0) return '无支出'
  return `支出 ${formatAmount(amount)}`
}

function handleCellClick(cell) {
  if (!cell) return
  selectedDate.value = cell.date
}

function isSelectedDate(dateStr) {
  return dateStr === selectedDate.value
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ getGreeting() }}，{{ profile?.nickname || '用户' }}</h1>
        <p class="page-subtitle">这是你的财务概览</p>
      </div>
    </div>

    <div class="stats-grid">
      <StatCard
        title="当日支出"
        :value="dayStats.expense"
        prefix="¥"
        :icon="Top"
        color="#ef4444"
        :loading="loadingDay"
      />
      <StatCard
        title="当日收入"
        :value="dayStats.income"
        prefix="¥"
        :icon="Bottom"
        color="#22c55e"
        :loading="loadingDay"
      />
      <StatCard
        title="当日结余"
        :value="dayStats.balance"
        prefix="¥"
        :icon="Wallet"
        color="#6366f1"
        :loading="loadingDay"
      />
      <StatCard
        title="当日账单数"
        :value="dayStats.count"
        suffix=" 笔"
        :icon="Tickets"
        color="#f59e0b"
        :loading="loadingDay"
      />
    </div>

    <div class="dashboard-grid">
      <div class="section-card calendar-section">
        <div class="section-header">
          <h3 class="section-title">
            {{ month + 1 }}月消费热力图
            <span v-if="selectedDate !== today" class="selected-date-tag">
              {{ selectedDate }}
            </span>
          </h3>
          <div class="calendar-legend">
            <span class="legend-label">少</span>
            <span class="legend-cell" style="background: var(--color-bg-tertiary)"></span>
            <span class="legend-cell" style="background: rgb(239, 180, 180)"></span>
            <span class="legend-cell" style="background: rgb(239, 120, 120)"></span>
            <span class="legend-cell" style="background: rgb(239, 68, 68)"></span>
            <span class="legend-label">多</span>
          </div>
        </div>

        <div v-if="loadingMonth" class="loading-state">
          <el-icon :size="24" class="is-loading"><el-icon-loading></el-icon-loading></el-icon>
        </div>

        <div v-else class="calendar-grid">
          <div class="calendar-header">
            <span v-for="d in weekDays" :key="d" class="weekday-label">{{ d }}</span>
          </div>
          <div class="calendar-body">
            <div
              v-for="(week, wi) in calendarData.weeks"
              :key="wi"
              class="calendar-week"
            >
              <el-tooltip
                v-for="(cell, ci) in week"
                :key="ci"
                :content="cell ? `${cell.date}  ${formatTooltipAmount(cell.amount)}` : ''"
                :disabled="!cell"
                placement="top"
                effect="dark"
              >
                <div
                  v-if="cell"
                  class="calendar-cell"
                  :class="{ 'is-today': cell.date === today, 'is-selected': isSelectedDate(cell.date) }"
                  :style="{ background: cellColor(cell.intensity) }"
                  @click="handleCellClick(cell)"
                >
                  <span class="cell-day">{{ cell.day }}</span>
                </div>
                <div v-else class="calendar-cell empty"></div>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>

      <div class="section-card recent-section">
        <div class="section-header">
          <h3 class="section-title">最近账单</h3>
          <el-button text type="primary" size="small" @click="router.push('/bills')">
            查看全部
            <el-icon :size="14"><el-icon-arrow-right></el-icon-arrow-right></el-icon>
          </el-button>
        </div>

        <div v-if="loadingBills" class="loading-state">
          <el-icon :size="24" class="is-loading"><el-icon-loading></el-icon-loading></el-icon>
        </div>

        <div v-else-if="!recentBills.length" class="empty-state">
          <p>暂无账单记录</p>
          <el-button type="primary" size="small" @click="router.push('/bills')">
            去添加账单
          </el-button>
        </div>

        <div v-else class="recent-list">
          <div
            v-for="bill in recentBills"
            :key="bill.id"
            class="recent-item"
          >
            <div
              class="recent-icon"
              :style="{ background: bill.categories?.color || '#6366f1' }"
            >
              <el-icon :size="16" color="#fff">
                <component :is="getCategoryIcon(bill.categories?.name)" />
              </el-icon>
            </div>
            <div class="recent-info">
              <span class="recent-category">{{ bill.categories?.name || '未分类' }}</span>
              <span class="recent-note" v-if="bill.note">{{ bill.note }}</span>
            </div>
            <div class="recent-right">
              <span
                class="recent-amount"
                :class="bill.type === 'income' ? 'income' : 'expense'"
              >
                {{ bill.type === 'income' ? '+' : '-' }}{{ formatAmount(bill.amount) }}
              </span>
              <span class="recent-date">{{ formatDate(bill.bill_date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--spacing-lg);

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.section-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.section-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.selected-date-tag {
  display: inline-block;
  margin-left: var(--spacing-sm);
  padding: 2px 8px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-brand);
  background: rgba(99, 102, 241, 0.1);
  border-radius: var(--radius-sm);
  vertical-align: middle;
}

.calendar-section {
  min-height: 240px;
}

.calendar-legend {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.legend-cell {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.calendar-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 2px;
}

.weekday-label {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  padding: 2px 0;
}

.calendar-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-cell {
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform var(--transition-fast);
  position: relative;

  &:hover {
    transform: scale(1.15);
    z-index: 1;
    box-shadow: var(--shadow-md);
  }

  &.is-today {
    box-shadow: 0 0 0 2px var(--color-brand);
  }

  &.is-selected {
    z-index: 1;
    box-shadow: 0 0 0 2px var(--color-brand), 0 0 0 4px rgba(99, 102, 241, 0.3);
    transform: scale(1.08);
  }

  &.empty {
    background: transparent;
    cursor: default;
  }
}

.cell-day {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  pointer-events: none;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--color-text-tertiary);
}

.recent-section {
  display: flex;
  flex-direction: column;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.recent-list {
  display: flex;
  flex-direction: column;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }
}

.recent-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.recent-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recent-category {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-primary);
}

.recent-note {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-right {
  text-align: right;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recent-amount {
  font-size: var(--font-size-sm);
  font-weight: 600;

  &.income { color: var(--color-income); }
  &.expense { color: var(--color-expense); }
}

.recent-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}
</style>
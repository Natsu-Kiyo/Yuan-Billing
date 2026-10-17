<script setup>
// 折线图组件（ECharts）：月度收支趋势，支持 ResizeObserver 自适应
import { computed } from 'vue'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { useChartTheme } from '@/composables/useChartTheme'
import { THEME_COLORS, withAlpha } from '@/constants/theme'

use([LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const props = defineProps({
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  height: { type: String, default: '320px' },
})

const { bgCard, borderColor, textPrimary, textSecondary } = useChartTheme()

// 从原始数据中提取 months / expenses / incomes 三条序列
const option = computed(() => {
  const months = props.data.map((d) => d.month)
  const expenses = props.data.map((d) => d.expense)
  const incomes = props.data.map((d) => d.income)

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: bgCard.value,
      borderColor: borderColor.value,
      textStyle: { color: textPrimary.value, fontSize: 13 },
      formatter: (params) => {
        let html = `${params[0].axisValue}<br/>`
        params.forEach((p) => {
          html += `${p.marker} ${p.seriesName}: ¥${p.value.toFixed(2)}<br/>`
        })
        return html
      },
    },
    legend: {
      data: ['支出', '收入'],
      bottom: 0,
      textStyle: { color: textSecondary.value, fontSize: 12 },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '40px',
      top: '12px',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: borderColor.value } },
      axisLabel: { color: textSecondary.value, fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: borderColor.value, type: 'dashed' } },
      axisLabel: {
        color: textSecondary.value,
        fontSize: 11,
        formatter: (v) => `¥${v}`,
      },
    },
    series: [
      {
        name: '支出',
        type: 'line',
        data: expenses,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: THEME_COLORS.expense, width: 2.5 },
        itemStyle: { color: THEME_COLORS.expense },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: withAlpha(THEME_COLORS.expense, 0.15) },
              { offset: 1, color: withAlpha(THEME_COLORS.expense, 0.01) },
            ],
          },
        },
      },
      {
        name: '收入',
        type: 'line',
        data: incomes,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: THEME_COLORS.income, width: 2.5 },
        itemStyle: { color: THEME_COLORS.income },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: withAlpha(THEME_COLORS.income, 0.15) },
              { offset: 1, color: withAlpha(THEME_COLORS.income, 0.01) },
            ],
          },
        },
      },
    ],
  }
})
</script>

<template>
  <div class="line-chart-wrapper">
    <v-chart v-if="data.length" :option="option" :style="{ height }" autoresize />
    <div v-else class="chart-empty">暂无数据</div>
  </div>
</template>

<style lang="less" scoped>
.line-chart-wrapper {
  width: 100%;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 320px;
  color: var(--color-text-tertiary);
  font-size: 14px;
}
</style>

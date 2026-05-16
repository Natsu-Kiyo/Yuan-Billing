<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getInstanceByDom } from 'echarts'
import VChart from 'vue-echarts'

use([LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const props = defineProps({
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  height: { type: String, default: '320px' },
})

const wrapperRef = ref(null)
let resizeObserver = null

onMounted(() => {
  if (wrapperRef.value) {
    resizeObserver = new ResizeObserver(() => {
      const divs = wrapperRef.value.querySelectorAll('div')
      divs.forEach((el) => {
        const instance = getInstanceByDom(el)
        if (instance) {
          instance.resize()
        }
      })
    })
    resizeObserver.observe(wrapperRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

const option = computed(() => {
  const months = props.data.map((d) => d.month)
  const expenses = props.data.map((d) => d.expense)
  const incomes = props.data.map((d) => d.income)

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--border-color)',
      textStyle: { color: 'var(--text-primary)', fontSize: 13 },
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
      textStyle: { color: 'var(--text-secondary)', fontSize: 12 },
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
      axisLine: { lineStyle: { color: 'var(--border-color)' } },
      axisLabel: { color: 'var(--text-secondary)', fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } },
      axisLabel: {
        color: 'var(--text-secondary)',
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
        lineStyle: { color: '#ef4444', width: 2.5 },
        itemStyle: { color: '#ef4444' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.15)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.01)' },
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
        lineStyle: { color: '#22c55e', width: 2.5 },
        itemStyle: { color: '#22c55e' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(34, 197, 94, 0.15)' },
              { offset: 1, color: 'rgba(34, 197, 94, 0.01)' },
            ],
          },
        },
      },
    ],
  }
})
</script>

<template>
  <div ref="wrapperRef" class="line-chart-wrapper">
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
  color: var(--text-muted);
  font-size: 14px;
}
</style>
<script setup>
// 柱状图组件（ECharts）：分类金额对比，带圆角柱体，支持 ResizeObserver 自适应
import { computed } from 'vue'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { useChartTheme } from '@/composables/useChartTheme'

use([BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const props = defineProps({
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  height: { type: String, default: '320px' },
})

const { bgCard, borderColor, textPrimary, textSecondary } = useChartTheme()

// 从 data 中提取名称、金额、颜色
const option = computed(() => {
  const names = props.data.map((d) => d.name)
  const values = props.data.map((d) => d.value)
  const colors = props.data.map((d) => d.color)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: bgCard.value,
      borderColor: borderColor.value,
      textStyle: { color: textPrimary.value, fontSize: 13 },
      formatter: (params) => {
        const p = params[0]
        return `${p.name}<br/>${p.marker} 金额: ¥${p.value.toFixed(2)}`
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8px',
      top: '12px',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: borderColor.value } },
      axisLabel: {
        color: textSecondary.value,
        fontSize: 11,
        rotate: names.length > 6 ? 30 : 0,
      },
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
        type: 'bar',
        data: values.map((v, i) => ({
          value: v,
          itemStyle: {
            color: colors[i],
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barWidth: '50%',
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.15)' },
        },
      },
    ],
  }
})
</script>

<template>
  <div class="bar-chart-wrapper">
    <v-chart v-if="data.length" :option="option" :style="{ height }" autoresize />
    <div v-else class="chart-empty">暂无数据</div>
  </div>
</template>

<style lang="less" scoped>
.bar-chart-wrapper {
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
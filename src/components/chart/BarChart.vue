<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getInstanceByDom } from 'echarts'
import VChart from 'vue-echarts'

use([BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

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
  const names = props.data.map((d) => d.name)
  const values = props.data.map((d) => d.value)
  const colors = props.data.map((d) => d.color)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--border-color)',
      textStyle: { color: 'var(--text-primary)', fontSize: 13 },
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
      axisLine: { lineStyle: { color: 'var(--border-color)' } },
      axisLabel: {
        color: 'var(--text-secondary)',
        fontSize: 11,
        rotate: names.length > 6 ? 30 : 0,
      },
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
  <div ref="wrapperRef" class="bar-chart-wrapper">
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
  color: var(--text-muted);
  font-size: 14px;
}
</style>
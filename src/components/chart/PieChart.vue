<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getInstanceByDom } from 'echarts'
import VChart from 'vue-echarts'

use([PieChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer])

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

const option = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: ¥{c} ({d}%)',
    backgroundColor: 'var(--bg-card)',
    borderColor: 'var(--border-color)',
    textStyle: { color: 'var(--text-primary)', fontSize: 13 },
  },
  legend: {
    bottom: 0,
    textStyle: { color: 'var(--text-secondary)', fontSize: 12 },
  },
  series: [
    {
      type: 'pie',
      radius: ['45%', '72%'],
      center: ['50%', '48%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 4,
        borderColor: 'var(--bg-card)',
        borderWidth: 2,
      },
      label: {
        show: false,
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold',
        },
        scaleSize: 8,
      },
      data: props.data.map((item) => ({
        name: item.name,
        value: item.value,
        itemStyle: { color: item.color },
      })),
    },
  ],
}))
</script>

<template>
  <div ref="wrapperRef" class="pie-chart-wrapper">
    <v-chart v-if="data.length" :option="option" :style="{ height }" autoresize />
    <div v-else class="chart-empty">暂无数据</div>
  </div>
</template>

<style lang="less" scoped>
.pie-chart-wrapper {
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
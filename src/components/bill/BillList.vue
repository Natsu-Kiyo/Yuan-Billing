<script setup>
// 账单列表容器：根据 loading / 数据量 渲染加载态、账单列表或空状态
import BillItem from './BillItem.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

defineProps({
  bills: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['edit', 'delete'])
</script>

<template>
  <div class="bill-list">
    <LoadingSpinner v-if="loading" text="加载账单中..." />

    <template v-else-if="bills.length > 0">
      <BillItem
        v-for="bill in bills"
        :key="bill.id"
        :bill="bill"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
      />
    </template>

    <EmptyState v-else description="暂无账单记录" />
  </div>
</template>

<style lang="less" scoped>
.bill-list {
  display: flex;
  flex-direction: column;
}
</style>
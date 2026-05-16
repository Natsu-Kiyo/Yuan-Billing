<script setup>
import { computed } from 'vue'
import {
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
  Wallet,
  Present,
  MoreFilled,
} from '@element-plus/icons-vue'
import { formatAmount, formatDate } from '@/utils/format'

const props = defineProps({
  bill: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['edit', 'delete'])

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

const categoryColor = props.bill?.categories?.color || '#6366f1'
const categoryName = props.bill?.categories?.name || '未分类'
const isExpense = props.bill?.type === 'expense'
const iconComponent = computed(() => iconMap[categoryName] || Wallet)
</script>

<template>
  <div class="bill-item">
    <div class="bill-left">
      <div class="bill-icon" :style="{ background: categoryColor + '20', color: categoryColor }">
        <el-icon :size="18">
          <component :is="iconComponent" />
        </el-icon>
      </div>
      <div class="bill-info">
        <div class="bill-category">{{ categoryName }}</div>
        <div class="bill-meta">
          <span class="bill-date">{{ formatDate(bill.bill_date) }}</span>
          <span v-if="bill.note" class="bill-note">{{ bill.note }}</span>
        </div>
      </div>
    </div>

    <div class="bill-right">
      <span class="bill-amount" :class="{ expense: isExpense, income: !isExpense }">
        {{ isExpense ? '-' : '+' }}{{ formatAmount(bill.amount) }}
      </span>
      <div class="bill-actions">
        <button class="action-btn" @click="emit('edit', bill)" title="编辑">
          <el-icon :size="16"><el-icon-edit></el-icon-edit></el-icon>
        </button>
        <button class="action-btn delete-btn" @click="emit('delete', bill)" title="删除">
          <el-icon :size="16"><el-icon-delete></el-icon-delete></el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.bill-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-bg-tertiary);

    .bill-actions {
      opacity: 1;
    }
  }
}

.bill-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  min-width: 0;
}

.bill-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bill-info {
  min-width: 0;
}

.bill-category {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.bill-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.bill-note {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;

  &::before {
    content: '· ';
  }
}

.bill-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.bill-amount {
  font-size: var(--font-size-md);
  font-weight: 600;
  font-variant-numeric: tabular-nums;

  &.expense {
    color: var(--color-expense);
  }

  &.income {
    color: var(--color-income);
  }
}

.bill-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text-primary);
  }

  &.delete-btn:hover {
    background: var(--color-danger-light);
    color: var(--color-danger);
  }
}

@media (max-width: 640px) {
  .bill-actions {
    opacity: 1;
  }

  .bill-note {
    display: none;
  }
}
</style>
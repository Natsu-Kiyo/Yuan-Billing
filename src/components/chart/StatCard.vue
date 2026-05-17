<script setup>
defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], default: 0 },
  prefix: { type: String, default: '' },
  suffix: { type: String, default: '' },
  icon: { type: Object, default: null },
  color: { type: String, default: '#6366f1' },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <div class="stat-card" :style="{ '--card-color': color }">
    <div class="stat-card-header">
      <span class="stat-card-title">{{ title }}</span>
      <div class="stat-card-icon" v-if="icon">
        <el-icon :size="18"><component :is="icon" /></el-icon>
      </div>
    </div>
    <div class="stat-card-body">
      <span v-if="loading" class="stat-card-loading">--</span>
      <span v-else class="stat-card-value">
        <span class="stat-card-prefix" v-if="prefix">{{ prefix }}</span>
        {{ typeof value === 'number' ? value.toFixed(2) : value }}
        <span class="stat-card-suffix" v-if="suffix">{{ suffix }}</span>
      </span>
    </div>
  </div>
</template>

<style lang="less" scoped>
.stat-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: var(--card-color);
    opacity: 0.6;
  }

  &:hover {
    border-color: var(--card-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
}

.stat-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.stat-card-title {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.stat-card-icon {
  color: var(--card-color);
  opacity: 0.7;
}

.stat-card-body {
  display: flex;
  align-items: baseline;
}

.stat-card-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.stat-card-prefix {
  font-size: 18px;
  font-weight: 500;
  margin-right: 2px;
}

.stat-card-suffix {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text-secondary);
  margin-left: 4px;
}

.stat-card-loading {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-tertiary);
}
</style>
<script setup>
// 加载中占位组件：旋转动画 + 可选文字
defineProps({
  text: {
    type: String,
    default: '加载中...',
  },
})
</script>

<template>
  <div class="loading-spinner">
    <div class="spinner"></div>
    <p v-if="text" class="spinner-text">{{ text }}</p>
  </div>
</template>

<style lang="less" scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  gap: var(--spacing-lg);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}
</style>
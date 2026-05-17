<script setup>
import { ref } from 'vue'

const props = defineProps({
  error: { type: Error, default: null },
})

const emit = defineEmits(['retry'])

const showDetail = ref(false)

function handleRetry() {
  emit('retry')
}
</script>

<template>
  <div class="error-boundary">
    <div class="error-content">
      <el-icon :size="56" color="var(--el-color-danger)">
        <el-icon-warning-filled></el-icon-warning-filled>
      </el-icon>
      <h2 class="error-title">页面出现异常</h2>
      <p class="error-message">{{ error?.message || '应用发生了未知错误，请尝试刷新页面' }}</p>
      <div class="error-actions">
        <el-button type="primary" @click="handleRetry">刷新页面</el-button>
        <el-button v-if="error?.stack" text type="info" @click="showDetail = !showDetail">
          {{ showDetail ? '收起详情' : '查看详情' }}
        </el-button>
      </div>
      <pre v-if="showDetail && error?.stack" class="error-stack">{{ error.stack }}</pre>
    </div>
  </div>
</template>

<style lang="less" scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg-secondary);
  padding: var(--spacing-xl);
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 480px;
  gap: var(--spacing-md);
}

.error-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.error-message {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.error-stack {
  width: 100%;
  max-height: 200px;
  overflow: auto;
  font-size: 11px;
  color: var(--color-text-tertiary);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  text-align: left;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
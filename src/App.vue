<script setup>
// 根组件：处理全局异常捕获、认证初始化加载态
import { ref, onErrorCaptured } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'

const authStore = useAuthStore()
const { initialized } = storeToRefs(authStore)

const appError = ref(null)

// 捕获子组件树中的未处理异常
onErrorCaptured((err) => {
  appError.value = err
  return false
})

// 异常恢复：刷新页面
function handleRetry() {
  window.location.reload()
}
</script>

<template>
  <!-- 全局异常边界 -->
  <ErrorBoundary v-if="appError" :error="appError" @retry="handleRetry" />
  <template v-else>
    <!-- 认证初始化前的加载状态 -->
    <div v-if="!initialized" class="app-loading">
      <div class="app-loading-spinner">
        <el-icon :size="36" class="is-loading"><el-icon-loading></el-icon-loading></el-icon>
      </div>
    </div>
    <!-- 认证完成后渲染路由页面 -->
    <router-view v-else />
  </template>
</template>

<style lang="less">
@import '@/assets/styles/global.less';

.app-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.app-loading-spinner {
  color: var(--color-brand);
}
</style>

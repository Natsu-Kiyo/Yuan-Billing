<script setup>
import { ref, onErrorCaptured } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'

const authStore = useAuthStore()
const { initialized } = storeToRefs(authStore)

const appError = ref(null)

onErrorCaptured((err) => {
  appError.value = err
  return false
})

function handleRetry() {
  window.location.reload()
}
</script>

<template>
  <ErrorBoundary v-if="appError" :error="appError" @retry="handleRetry" />
  <template v-else>
    <div v-if="!initialized" class="app-loading">
      <div class="app-loading-spinner">
        <el-icon :size="36" class="is-loading"><el-icon-loading></el-icon-loading></el-icon>
      </div>
    </div>
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
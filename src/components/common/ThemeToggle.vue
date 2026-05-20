<script setup>
// 主题切换按钮：亮色/暗色一键切换
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button class="theme-toggle" @click="toggleTheme" :title="isDark ? '切换浅色模式' : '切换深色模式'">
    <el-icon :size="20">
      <el-icon-sunny v-if="isDark" />
      <el-icon-moon v-else />
    </el-icon>
  </button>
</template>

<style lang="less" scoped>
.theme-toggle {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }
}
</style>
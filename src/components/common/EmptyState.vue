<script setup>
// 空状态占位组件：文件夹图标 + 描述文字
defineProps({
  description: {
    type: String,
    default: '暂无数据',
  },
})
</script>

<template>
  <div class="empty-state">
    <el-icon :size="48" color="var(--color-text-tertiary)">
      <el-icon-folder-opened></el-icon-folder-opened>
    </el-icon>
    <p class="empty-text">{{ description }}</p>
  </div>
</template>

<style lang="less" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  gap: var(--spacing-lg);
}

.empty-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}
</style>

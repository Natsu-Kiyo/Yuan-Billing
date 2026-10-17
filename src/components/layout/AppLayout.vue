<script setup>
// 应用主布局：侧边栏 + 顶栏 + 内容区的经典管理后台骨架
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'

const sidebarCollapsed = ref(false)
const isMobile = ref(false)

// 根据侧边栏折叠状态和是否为移动端，动态计算侧边栏宽度
const sidebarWidth = computed(() => {
  if (isMobile.value) return '0px'
  return sidebarCollapsed.value ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'
})

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 响应式断点检测，移动端自动隐藏侧边栏
function handleResize() {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="app-layout">
    <Sidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />
    <div class="layout-main" :style="{ marginLeft: sidebarWidth }">
      <Navbar
        :sidebar-collapsed="sidebarCollapsed"
        :navbar-left="sidebarWidth"
        @toggle-sidebar="toggleSidebar"
      />
      <main class="layout-content">
        <router-view v-slot="{ Component }">
          <transition name="slide-up" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style lang="less" scoped>
.app-layout {
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.layout-main {
  transition: margin-left var(--transition-base);
  min-height: 100vh;
}

.layout-content {
  padding-top: var(--navbar-height);
  min-height: calc(100vh - var(--navbar-height));
}

@media (max-width: 768px) {
  .layout-main {
    margin-left: 0 !important;
  }
}
</style>

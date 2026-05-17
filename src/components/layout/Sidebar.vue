<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DataBoard,
  Tickets,
  PieChart,
  Cpu,
  User,
} from '@element-plus/icons-vue'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle'])

const route = useRoute()
const router = useRouter()

const menuItems = [
  {
    path: '/dashboard',
    title: '首页',
    icon: DataBoard,
  },
  {
    path: '/bills',
    title: '账单管理',
    icon: Tickets,
  },
  {
    path: '/statistics',
    title: '数据统计',
    icon: PieChart,
  },
  {
    path: '/ai-analysis',
    title: 'AI 分析',
    icon: Cpu,
  },
  {
    path: '/profile',
    title: '用户中心',
    icon: User,
  },
]

const activeMenu = computed(() => route.path)

function navigate(path) {
  router.push(path)
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="sidebar-header" @click="emit('toggle')">
      <div class="logo-icon">
        <el-icon :size="22" color="#fff">
          <el-icon-wallet></el-icon-wallet>
        </el-icon>
      </div>
      <transition name="fade">
        <span v-show="!collapsed" class="logo-text">YuanBilling</span>
      </transition>
    </div>

    <nav class="sidebar-nav">
      <button
        v-for="item in menuItems"
        :key="item.path"
        class="nav-item"
        :class="{ active: activeMenu === item.path }"
        @click="navigate(item.path)"
        :title="collapsed ? item.title : ''"
      >
        <el-icon :size="20">
          <component :is="item.icon" />
        </el-icon>
        <transition name="fade">
          <span v-show="!collapsed" class="nav-title">{{ item.title }}</span>
        </transition>
      </button>
    </nav>

    <div class="sidebar-footer">
      <button class="collapse-btn" @click="emit('toggle')" :title="collapsed ? '展开菜单' : '收起菜单'">
        <el-icon :size="18">
          <el-icon-d-arrow-left v-if="!collapsed" />
          <el-icon-d-arrow-right v-else />
        </el-icon>
      </button>
    </div>
  </aside>
</template>

<style lang="less" scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--color-bg-card);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: width var(--transition-base);

  &.collapsed {
    width: var(--sidebar-collapsed-width);
  }
}

.sidebar-header {
  height: var(--navbar-height);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: 0 var(--spacing-lg);
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-light);
  overflow: hidden;
}

.logo-icon {
  width: 32px;
  height: 32px;
  min-width: 32px;
  background: linear-gradient(135deg, var(--color-brand) 0%, #7c3aed 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: 10px var(--spacing-md);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
  white-space: nowrap;
  overflow: hidden;

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  &.active {
    background: var(--color-brand-bg);
    color: var(--color-brand);

    :deep(.el-icon) {
      color: var(--color-brand);
    }
  }
}

.nav-title {
  white-space: nowrap;
}

.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
}

.collapse-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  color: var(--color-text-tertiary);
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: var(--sidebar-width);
    transform: translateX(-100%);
    box-shadow: var(--shadow-xl);

    &:not(.collapsed) {
      transform: translateX(0);
    }

    &.collapsed {
      width: var(--sidebar-width);
      transform: translateX(-100%);
    }
  }
}
</style>
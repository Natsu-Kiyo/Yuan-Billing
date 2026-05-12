<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import ThemeToggle from '@/components/common/ThemeToggle.vue'

defineProps({
  sidebarCollapsed: {
    type: Boolean,
    default: false,
  },
  navbarLeft: {
    type: String,
    default: 'var(--sidebar-width)',
  },
})

const emit = defineEmits(['toggle-sidebar'])

const router = useRouter()
const { profile, logout } = useAuth()

async function handleLogout() {
  try {
    await logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (err) {
    ElMessage.error(err.message || '退出失败')
  }
}

function handleCommand(command) {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    handleLogout()
  }
}
</script>

<template>
  <header class="navbar" :style="{ left: navbarLeft }">
    <div class="navbar-left">
      <button class="menu-toggle" @click="emit('toggle-sidebar')">
        <el-icon :size="20">
          <el-icon-expand v-if="sidebarCollapsed" />
          <el-icon-fold v-else />
        </el-icon>
      </button>
    </div>

    <div class="navbar-right">
      <ThemeToggle />

      <el-dropdown trigger="click" @command="handleCommand">
        <button class="user-avatar-btn">
          <el-avatar :size="32" icon="UserFilled" />
          <span class="user-name">{{ profile?.nickname || '用户' }}</span>
          <el-icon :size="14" class="dropdown-arrow">
            <el-icon-arrow-down></el-icon-arrow-down>
          </el-icon>
        </button>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon :size="16"><el-icon-user></el-icon-user></el-icon>
              <span>用户中心</span>
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              <el-icon :size="16"><el-icon-switch-button></el-icon-switch-button></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style lang="less" scoped>
.navbar {
  position: fixed;
  top: 0;
  right: 0;
  height: var(--navbar-height);
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-xl);
  z-index: 90;
  transition: left var(--transition-base);
}

.navbar-left {
  display: flex;
  align-items: center;
}

.menu-toggle {
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

.navbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-avatar-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 4px var(--spacing-sm) 4px 4px;
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-tertiary);
  }
}

.user-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow {
  color: var(--color-text-tertiary);
}

@media (max-width: 768px) {
  .navbar {
    left: 0;
  }

  .user-name {
    display: none;
  }
}
</style>
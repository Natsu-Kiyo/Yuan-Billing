<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useStatistics } from '@/composables/useStatistics'
import { formatAmount } from '@/utils/format'

const router = useRouter()
const { user, userId, profile, updateProfile, logout } = useAuth()
const { totalExpense, totalIncome, balance, billCount, fetchStats } = useStatistics()

const editing = ref(false)
const saving = ref(false)
const editForm = ref({ nickname: '' })

onMounted(async () => {
  if (userId.value) {
    await fetchStats(userId.value)
  }
})

function startEdit() {
  editForm.value.nickname = profile.value?.nickname || ''
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

async function handleSave() {
  if (!editForm.value.nickname.trim()) {
    ElMessage.warning('昵称不能为空')
    return
  }
  saving.value = true
  try {
    await updateProfile({ nickname: editForm.value.nickname.trim() })
    ElMessage.success('昵称修改成功')
    editing.value = false
  } catch (err) {
    ElMessage.error(err.message || '修改失败')
  } finally {
    saving.value = false
  }
}

async function handleLogout() {
  try {
    await logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (err) {
    ElMessage.error(err.message || '退出失败')
  }
}

function formatJoinDate(dateStr) {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">用户中心</h1>
        <p class="page-subtitle">管理你的账户信息</p>
      </div>
    </div>

    <div class="profile-grid">
      <div class="section-card profile-card">
        <div class="profile-avatar">
          <el-avatar :size="72" icon="UserFilled" />
        </div>

        <div v-if="!editing" class="profile-info">
          <h2 class="profile-name">{{ profile?.nickname || '未设置昵称' }}</h2>
          <p class="profile-email">{{ user?.email || '--' }}</p>
          <p class="profile-date">注册于 {{ formatJoinDate(user?.created_at) }}</p>
          <el-button type="primary" size="default" @click="startEdit">
            <el-icon :size="14"><el-icon-edit></el-icon-edit></el-icon>
            编辑资料
          </el-button>
        </div>

        <div v-else class="profile-edit">
          <div class="edit-field">
            <label class="edit-label">昵称</label>
            <el-input
              v-model="editForm.nickname"
              placeholder="请输入昵称"
              maxlength="20"
              show-word-limit
            />
          </div>
          <div class="edit-actions">
            <el-button @click="cancelEdit">取消</el-button>
            <el-button type="primary" :loading="saving" @click="handleSave">
              保存
            </el-button>
          </div>
        </div>
      </div>

      <div class="section-card stats-card">
        <h3 class="section-title">账户统计</h3>
        <div class="stats-list">
          <div class="stats-row">
            <span class="stats-label">总支出</span>
            <span class="stats-value expense">{{ formatAmount(totalExpense) }}</span>
          </div>
          <div class="stats-row">
            <span class="stats-label">总收入</span>
            <span class="stats-value income">{{ formatAmount(totalIncome) }}</span>
          </div>
          <div class="stats-row">
            <span class="stats-label">结余</span>
            <span class="stats-value" :class="balance >= 0 ? 'income' : 'expense'">
              {{ formatAmount(balance) }}
            </span>
          </div>
          <div class="stats-row">
            <span class="stats-label">账单总数</span>
            <span class="stats-value">{{ billCount }} 笔</span>
          </div>
        </div>
      </div>

      <div class="section-card settings-card">
        <h3 class="section-title">账户设置</h3>
        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">邮箱</span>
              <span class="setting-value">{{ user?.email || '--' }}</span>
            </div>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">用户 ID</span>
              <span class="setting-value mono">{{ userId || '--' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section-card danger-card">
        <h3 class="section-title danger-title">危险操作</h3>
        <p class="danger-desc">退出当前账户，你需要重新登录才能访问。</p>
        <el-button type="danger" plain size="default" @click="handleLogout">
          <el-icon :size="14"><el-icon-switch-button></el-icon-switch-button></el-icon>
          退出登录
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.section-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

.section-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-lg);
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.profile-avatar {
  margin-bottom: var(--spacing-lg);
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.profile-name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.profile-email {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.profile-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin: 0 0 var(--spacing-md);
}

.profile-edit {
  width: 100%;
  max-width: 280px;
}

.edit-field {
  margin-bottom: var(--spacing-lg);
}

.edit-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.edit-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

.stats-list {
  display: flex;
  flex-direction: column;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }
}

.stats-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.stats-value {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);

  &.expense { color: var(--color-expense); }
  &.income { color: var(--color-income); }
}

.settings-list {
  display: flex;
  flex-direction: column;
}

.setting-item {
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.setting-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);

  &.mono {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    word-break: break-all;
  }
}

.danger-title {
  color: var(--color-danger);
}

.danger-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-md);
}
</style>
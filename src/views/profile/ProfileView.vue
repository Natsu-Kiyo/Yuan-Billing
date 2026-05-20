<script setup>
// 个人中心页：资料展示、昵称编辑、头像上传/移除、统计概览、退出登录
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useStatistics } from '@/composables/useStatistics'
import { formatAmount } from '@/utils/format'
import { getAvatarUrl } from '@/utils/avatar'
import { supabase } from '@/api/supabase'

const router = useRouter()
const { user, userId, profile, updateProfile, logout } = useAuth()
const { totalExpense, totalIncome, balance, billCount, fetchStats } = useStatistics()

// 头像 URL：优先自定义，否则通过昵称自动生成
const avatarUrl = computed(() => getAvatarUrl(profile.value?.nickname, 144, profile.value?.avatar_url))

const editing = ref(false)
const saving = ref(false)
const uploading = ref(false)
const fileInput = ref(null)
const editForm = ref({ nickname: '' })

onMounted(async () => {
  if (userId.value) {
    await fetchStats(userId.value)
  }
})

// --- 昵称编辑 ---

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

// --- 退出登录 ---

async function handleLogout() {
  try {
    await logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (err) {
    ElMessage.error(err.message || '退出失败')
  }
}

/** 格式化注册时间为中文日期 */
function formatJoinDate(dateStr) {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

// --- 头像上传 ---

function triggerUpload() {
  fileInput.value?.click()
}

/** 上传头像到 Supabase Storage，更新 profile */
async function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 2MB')
    return
  }

  uploading.value = true
  try {
    const ext = file.name.split('.').pop()
    const filePath = `${userId.value}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    await updateProfile({ avatar_url: urlData.publicUrl })
    ElMessage.success('头像上传成功')
  } catch (err) {
    ElMessage.error(err.message || '上传失败')
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

/** 移除自定义头像，恢复默认 */
async function handleRemoveAvatar() {
  uploading.value = true
  try {
    await updateProfile({ avatar_url: null })
    ElMessage.success('已恢复默认头像')
  } catch (err) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    uploading.value = false
  }
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
          <div class="avatar-wrapper" @click="triggerUpload">
            <el-avatar :size="72" :src="avatarUrl" />
            <div class="avatar-overlay">
              <el-icon :size="20"><el-icon-camera></el-icon-camera></el-icon>
            </div>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="file-input-hidden"
            @change="handleFileChange"
          />
          <div class="avatar-actions">
            <el-button
              size="small"
              :loading="uploading"
              @click="triggerUpload"
            >
              上传头像
            </el-button>
            <el-button
              v-if="profile?.avatar_url"
              size="small"
              type="danger"
              plain
              :disabled="uploading"
              @click="handleRemoveAvatar"
            >
              移除
            </el-button>
          </div>
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

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--spacing-md);

  &:hover .avatar-overlay {
    opacity: 1;
  }
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity var(--transition-fast);
  border-radius: var(--radius-full);
}

.file-input-hidden {
  display: none;
}

.avatar-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
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
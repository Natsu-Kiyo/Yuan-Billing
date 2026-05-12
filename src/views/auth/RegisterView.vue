<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { register, loading } = useAuth()

const formRef = ref(null)
const form = reactive({
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在2到20个字符之间', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

async function handleRegister() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    await register({
      email: form.email,
      password: form.password,
      nickname: form.nickname,
    })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (err) {
    if (err?.message) {
      ElMessage.error(err.message)
    }
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-brand">
      <div class="brand-content">
        <div class="brand-logo">
          <el-icon :size="40" color="#fff">
            <el-icon-wallet></el-icon-wallet>
          </el-icon>
        </div>
        <h1 class="brand-title">YuanBilling</h1>
        <p class="brand-desc">AI 智能财务管理，让每一笔消费都有意义</p>
        <div class="brand-features">
          <div class="feature-item">
            <el-icon :size="18" color="#a5b4fc">
              <el-icon-check></el-icon-check>
            </el-icon>
            <span>智能记账，轻松管理收支</span>
          </div>
          <div class="feature-item">
            <el-icon :size="18" color="#a5b4fc">
              <el-icon-check></el-icon-check>
            </el-icon>
            <span>AI 驱动消费分析与建议</span>
          </div>
          <div class="feature-item">
            <el-icon :size="18" color="#a5b4fc">
              <el-icon-check></el-icon-check>
            </el-icon>
            <span>可视化图表，消费一目了然</span>
          </div>
        </div>
      </div>
    </div>

    <div class="auth-form-wrapper">
      <div class="auth-form-card">
        <div class="form-header">
          <h2>创建账户</h2>
          <p>注册后即可开始智能记账</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="handleRegister"
        >
          <el-form-item label="昵称" prop="nickname">
            <el-input
              v-model="form.nickname"
              placeholder="请输入你的昵称"
              size="large"
            >
              <template #prefix>
                <el-icon><el-icon-user></el-icon-user></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="form.email"
              placeholder="请输入邮箱地址"
              size="large"
            >
              <template #prefix>
                <el-icon><el-icon-message></el-icon-message></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请设置密码（至少6位）"
              show-password
              size="large"
            >
              <template #prefix>
                <el-icon><el-icon-lock></el-icon-lock></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              show-password
              size="large"
            >
              <template #prefix>
                <el-icon><el-icon-lock></el-icon-lock></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="submit-btn"
              @click="handleRegister"
            >
              注 册
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <span>已有账户？</span>
          <router-link to="/login" class="link">立即登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.auth-page {
  display: flex;
  min-height: 100vh;
}

.auth-brand {
  flex: 1;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -30%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
    border-radius: 50%;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -20%;
    left: -10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
    border-radius: 50%;
  }
}

.brand-content {
  position: relative;
  z-index: 1;
  max-width: 420px;
}

.brand-logo {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-xl);
  backdrop-filter: blur(10px);
}

.brand-title {
  font-size: var(--font-size-3xl);
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.03em;
  margin-bottom: var(--spacing-md);
}

.brand-desc {
  font-size: var(--font-size-md);
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.7;
  margin-bottom: var(--spacing-2xl);
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  color: rgba(255, 255, 255, 0.85);
  font-size: var(--font-size-sm);
}

.auth-form-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  background: var(--color-bg-primary);
}

.auth-form-card {
  width: 100%;
  max-width: 400px;
}

.form-header {
  margin-bottom: var(--spacing-2xl);

  h2 {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text-primary);
    letter-spacing: -0.02em;
    margin-bottom: var(--spacing-sm);
  }

  p {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: var(--font-size-md);
  font-weight: 600;
  letter-spacing: 0.05em;
  border-radius: var(--radius-md);
}

.form-footer {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);

  .link {
    color: var(--color-brand);
    font-weight: 500;
    margin-left: var(--spacing-xs);

    &:hover {
      color: var(--color-brand-light);
    }
  }
}

@media (max-width: 768px) {
  .auth-brand {
    display: none;
  }

  .auth-form-wrapper {
    padding: var(--spacing-xl);
  }
}
</style>
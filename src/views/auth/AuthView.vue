<script setup>
// 认证页面：登录 / 注册表单切换，左侧品牌展示，右侧表单区
import { ref, reactive, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { login, register, loading } = useAuth()

// 当前模式：login | register，根据路由名称初始化
const mode = ref(route.name === 'Register' ? 'register' : 'login')

// 路由变化时同步模式
watch(
  () => route.name,
  (name) => {
    mode.value = name === 'Register' ? 'register' : 'login'
  },
)

const formRef = ref(null)
const form = reactive({
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
})

// 切换模式时清空字段值（表单通过 :key 自动重建）
function switchMode(m) {
  if (m === mode.value) return
  mode.value = m
  router.replace({ name: m === 'register' ? 'Register' : 'Login' })
  form.nickname = ''
  form.email = ''
  form.password = ''
  form.confirmPassword = ''
}

// 登录表单校验规则
const loginRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
}

// 注册表单校验规则
const validateConfirmPassword = (_rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules = {
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

const rules = computed(() => (mode.value === 'register' ? registerRules : loginRules))

const isLogin = computed(() => mode.value === 'login')

/** 登录后的回跳地址：仅允许站内路径，防止开放重定向 */
function resolveRedirect() {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect
  }
  return '/dashboard'
}

/** 登录 */
async function handleLogin() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    await login({ email: form.email, password: form.password })
    ElMessage.success('登录成功')
    router.push(resolveRedirect())
  } catch (err) {
    if (err?.message) {
      ElMessage.error(err.message)
    }
  }
}

/** 注册 */
async function handleRegister() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    await register({
      email: form.email,
      password: form.password,
      nickname: form.nickname,
    })
    ElMessage.success('注册成功，已自动登录')
    switchMode('login')
  } catch (err) {
    if (err?.message) {
      ElMessage.error(err.message)
    }
  }
}

function handleSubmit() {
  if (isLogin.value) {
    handleLogin()
  } else {
    handleRegister()
  }
}
</script>

<template>
  <div class="auth-page">
    <!-- 左侧品牌展示区 -->
    <div class="auth-brand">
      <div class="brand-content">
        <div class="brand-logo">
          <el-icon :size="40" color="#fff">
            <el-icon-wallet></el-icon-wallet>
          </el-icon>
        </div>
        <h1 class="brand-title">YuanBilling</h1>
        <p class="brand-desc">智能财务管理，让每一笔消费都有意义</p>
        <div class="brand-features">
          <div class="feature-item">
            <el-icon :size="18" color="#6ed5c0">
              <el-icon-check></el-icon-check>
            </el-icon>
            <span>智能记账，轻松管理收支</span>
          </div>
          <div class="feature-item">
            <el-icon :size="18" color="#6ed5c0">
              <el-icon-check></el-icon-check>
            </el-icon>
            <span>消费分析与智能建议</span>
          </div>
          <div class="feature-item">
            <el-icon :size="18" color="#6ed5c0">
              <el-icon-check></el-icon-check>
            </el-icon>
            <span>可视化图表，消费一目了然</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="auth-form-wrapper">
      <div class="auth-form-card">
        <div class="form-header">
          <h2>{{ isLogin ? '欢迎回来' : '创建账户' }}</h2>
          <p>{{ isLogin ? '登录你的账户继续使用' : '注册后即可开始智能记账' }}</p>
        </div>

        <el-form
          ref="formRef"
          :key="mode"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="handleSubmit"
        >
          <!-- 注册昵称 -->
          <el-form-item v-if="!isLogin" label="昵称" prop="nickname">
            <el-input v-model="form.nickname" placeholder="请输入你的昵称" size="large">
              <template #prefix>
                <el-icon><el-icon-user></el-icon-user></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- 邮箱 -->
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱地址" size="large">
              <template #prefix>
                <el-icon><el-icon-message></el-icon-message></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- 密码 -->
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              :placeholder="isLogin ? '请输入密码' : '请设置密码（至少6位）'"
              show-password
              size="large"
            >
              <template #prefix>
                <el-icon><el-icon-lock></el-icon-lock></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- 注册确认密码 -->
          <el-form-item v-if="!isLogin" label="确认密码" prop="confirmPassword">
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

          <!-- 提交按钮 -->
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="submit-btn"
              @click="handleSubmit"
            >
              {{ isLogin ? '登 录' : '注 册' }}
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 模式切换 -->
        <div class="form-footer">
          <span>{{ isLogin ? '还没有账户？' : '已有账户？' }}</span>
          <button class="link" @click="switchMode(isLogin ? 'register' : 'login')">
            {{ isLogin ? '立即注册' : '立即登录' }}
          </button>
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
  background: linear-gradient(160deg, #1a3a4a 0%, #1d4f63 40%, #246f85 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4xl) var(--spacing-3xl);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background:
      radial-gradient(ellipse 80% 60% at 80% 20%, rgba(110, 213, 192, 0.06) 0%, transparent 50%),
      radial-gradient(ellipse 60% 50% at 20% 80%, rgba(110, 213, 192, 0.04) 0%, transparent 50%);
    pointer-events: none;
  }
}

.brand-content {
  position: relative;
  z-index: 1;
  max-width: 420px;
}

.brand-logo {
  width: 56px;
  height: 56px;
  background: rgba(110, 213, 192, 0.12);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-2xl);
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
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.7;
  margin-bottom: var(--spacing-3xl);
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  color: rgba(255, 255, 255, 0.8);
  font-size: var(--font-size-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);

  &:hover {
    background: rgba(255, 255, 255, 0.07);
  }
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
    border: none;
    background: none;
    cursor: pointer;
    font-size: inherit;
    padding: 0;

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

// 路由配置：定义页面路由、懒加载、导航守卫（认证拦截）
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    // 访客路由（已登录用户自动跳转仪表盘）—— 登录和注册共用 AuthView
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/AuthView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/auth/AuthView.vue'),
      meta: { guest: true },
    },
    // 需登录路由（嵌套在 AppLayout 中）
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/DashboardView.vue'),
        },
        {
          path: 'bills',
          name: 'Bills',
          component: () => import('@/views/bills/BillsView.vue'),
        },
        {
          path: 'statistics',
          name: 'Statistics',
          component: () => import('@/views/statistics/StatisticsView.vue'),
        },
        {
          path: 'ai-analysis',
          name: 'AIAnalysis',
          component: () => import('@/views/ai/AIAnalysisView.vue'),
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/views/profile/ProfileView.vue'),
        },
      ],
    },
    // 404 兜底路由
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

// 全局前置守卫：初始化认证状态 + 权限拦截
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // 首次访问时从 Supabase 恢复登录态
  if (!authStore.initialized) {
    await authStore.initAuth()
  }

  // 需登录页面未登录 → 跳转登录页并带上重定向参数
  if (to.matched.some((record) => record.meta.requiresAuth) && !authStore.isLoggedIn) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  // 已登录用户访问 login/register → 跳转仪表盘
  if (to.meta.guest && authStore.isLoggedIn) {
    return { name: 'Dashboard' }
  }
})

export default router
// 应用入口：创建 Vue 实例、注册 Pinia/Router、初始化主题
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import '@/assets/styles/global.less'

const app = createApp(App)

// 状态管理与路由注册
const pinia = createPinia()
app.use(pinia)
app.use(router)

// 初始化主题（需在 mount 前完成，避免闪烁）
import { useThemeStore } from '@/stores/theme'
const themeStore = useThemeStore()
themeStore.initTheme()

app.mount('#app')

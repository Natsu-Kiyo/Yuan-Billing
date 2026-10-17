# Yuan-Billing — AI 智能财务管理系统

面向大学生的个人记账与消费分析平台，支持智能记账、数据可视化、AI 消费顾问等功能。

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Vue 3 + Vite |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| UI 组件库 | Element Plus |
| 图表 | ECharts + vue-echarts |
| CSS 预处理 | Less |
| 后端服务 | Supabase（认证 + PostgreSQL） |
| AI 服务 | 智谱 AI（GLM-4.7-Flash） |
| Markdown 渲染 | markdown-it |

## 功能特性

- **仪表盘** — 当日收支概览、月度消费热力图、最近账单
- **账单管理** — 账单增删改查、分类筛选、金额范围筛选、CSV 导入导出
- **数据统计** — 收支分类饼图、月度趋势折线图、分类排行柱状图
- **AI 消费分析** — 流式对话、消费报告生成、个性化理财建议
- **用户中心** — 个人资料编辑、账户统计、主题切换
- **深色模式** — 支持亮色/深色主题切换
- **响应式布局** — 适配桌面端与移动端

## 项目结构

```
src/
├── api/                  # API 接口层
│   ├── ai.js             # 智谱 AI 接口
│   ├── auth.js           # 认证接口
│   ├── bills.js          # 账单接口
│   ├── categories.js     # 分类接口
│   ├── statistics.js     # 统计接口
│   └── supabase.js       # Supabase 客户端
├── assets/
│   └── styles/           # 全局样式与变量
├── components/
│   ├── bill/             # 账单相关组件
│   ├── chart/            # 图表组件
│   ├── common/           # 通用组件
│   └── layout/           # 布局组件
├── composables/          # 组合式函数
├── router/               # 路由配置
├── stores/               # Pinia 状态管理
├── utils/                # 工具函数
└── views/                # 页面视图
    ├── ai/               # AI 分析页
    ├── auth/             # 登录/注册页
    ├── bills/            # 账单管理页
    ├── dashboard/        # 仪表盘
    ├── profile/          # 用户中心
    └── statistics/       # 数据统计页
```

## 快速开始

### 环境要求

- Node.js >= 20.19.0

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env`，填入以下配置：

```env
VITE_SUPABASE_URL=你的Supabase项目URL
VITE_SUPABASE_ANON_KEY=你的Supabase匿名密钥

# 仅供 Netlify Function 使用，不要加 VITE_ 前缀
ZHIPU_API_KEY=你的智谱AI API密钥
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 部署

项目已配置 `netlify.toml`，可直接部署到 Netlify：

1. 将项目推送到 GitHub
2. 在 Netlify 中导入该仓库
3. 在 Netlify 环境变量中配置 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`、`ZHIPU_API_KEY`
4. 在 Supabase Authentication → URL Configuration 中添加 Netlify 域名

## 数据库

本项目使用 Supabase 托管 PostgreSQL，核心数据表：

- `bills` — 账单记录
- `categories` — 收支分类
- `profiles` — 用户资料
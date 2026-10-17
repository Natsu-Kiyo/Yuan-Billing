# Yuan-Billing — AI 智能财务管理系统

面向大学生的个人记账与消费分析平台，支持智能记账、数据可视化、AI 消费顾问等功能。

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Vue 3 + Vite |
| 状态管理 | Pinia |
| 路由 | Vue Router 5 |
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

项目已配置 `netlify.toml`（构建命令 `npm run build`，发布目录 `dist`），服务端接口位于 `netlify/functions/`。

### 1. 部署到 Netlify

1. 将项目推送到 GitHub，并在 Netlify 导入仓库
2. 在 Site configuration → Environment variables 中配置：
   - `VITE_SUPABASE_URL`：Supabase 项目 URL（会打包进前端，属公开信息）
   - `VITE_SUPABASE_ANON_KEY`：Supabase anon key（公开信息，数据安全依赖 RLS）
   - `ZHIPU_API_KEY`：智谱 API 密钥（**服务端专用，不能加 `VITE_` 前缀**）
3. 在 Supabase Authentication → URL Configuration 中添加 Netlify 域名
4. 触发一次部署：修改环境变量或代码后都必须重新部署才会生效

`netlify/functions/ai.js` 会被自动识别为 `/.netlify/functions/ai`，无需额外配置。函数会先校验请求携带的 Supabase access token，通过后才用服务端密钥调用智谱，前端不会拿到密钥。

### 2. 本地开发

```bash
npm install
npm run dev
```

`vite.config.js` 中的 `netlifyFunctionsDev` 插件会在本地拦截 `/.netlify/functions/*` 并直接执行函数源码，因此本地无需安装 Netlify CLI，也不用运行 `netlify dev`。修改 `.env` 后需要重启 dev server。

### 3. 数据库迁移

`supabase/migrations/` 下的 SQL 需在 Supabase 项目中执行（按文件名顺序）：

- `20261017000000_init_billing_schema.sql`：建表、RLS 策略、注册自动创建 profile、头像存储策略、分类种子数据
- `20261017000001_bill_stats_rpc.sql`：统计聚合函数 `get_bill_stats`

执行方式二选一：

- Supabase Dashboard → SQL Editor，按顺序粘贴执行
- 安装 Supabase CLI 后执行 `supabase link --project-ref <project-ref>`，再 `supabase db push`

两个脚本均可重复执行：已存在的表不会被重建，同名策略会先删除再创建。

### 4. 部署后验证

- 注册/登录：新用户能自动生成 `profiles` 记录
- 账单：新增、编辑、删除、CSV 导入导出正常
- 统计：切换日期范围后图表与日均支出正常（依赖 `get_bill_stats`）
- AI 分析：未登录直接请求 `/.netlify/functions/ai` 返回 401，登录后可流式返回
- RLS：用两个账号交叉验证，彼此看不到对方的 `bills`

### 5. 常见问题

- **AI 返回 500「服务端未配置 ZHIPU_API_KEY」**：检查 Netlify 环境变量名（不要带 `VITE_` 前缀），修改后重新部署
- **修改环境变量后前端仍用旧值**：`VITE_` 变量在构建时内联，必须重新构建部署
- **统计页提示函数不存在**：未执行 `20261017000001_bill_stats_rpc.sql`

## 数据库

本项目使用 Supabase 托管 PostgreSQL，核心数据表：

- `bills` — 账单记录
- `categories` — 收支分类
- `profiles` — 用户资料
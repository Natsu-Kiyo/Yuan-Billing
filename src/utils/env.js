// 环境变量校验：缺失时尽早给出明确提示，避免 createClient 抛出晦涩错误
const REQUIRED_ENV_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']

/** 返回缺失的必需环境变量名 */
export function getMissingEnvKeys() {
  return REQUIRED_ENV_KEYS.filter((key) => !import.meta.env[key])
}

/** 校验必需环境变量，缺失时抛出可读错误 */
export function assertEnv() {
  const missing = getMissingEnvKeys()
  if (missing.length === 0) return

  throw new Error(
    `缺少必需的环境变量：${missing.join('、')}。` +
      '请复制 .env.example 为 .env 并填写配置后，重启开发服务器（npm run dev）。',
  )
}

/** 在页面上渲染配置错误提示（仅开发/首次启动时使用） */
export function renderEnvError(message) {
  if (typeof document === 'undefined') return

  const root = document.getElementById('app')
  if (!root) return

  const wrapper = document.createElement('div')
  wrapper.style.cssText =
    'min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;' +
    'background:#f8fafc;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;'

  const card = document.createElement('div')
  card.style.cssText =
    'max-width:560px;width:100%;padding:24px;border:1px solid #e2e8f0;border-radius:12px;' +
    'background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.08);'

  const title = document.createElement('h1')
  title.textContent = '应用配置缺失'
  title.style.cssText = 'margin:0 0 12px;font-size:18px;color:#0f172a;'

  const detail = document.createElement('p')
  detail.textContent = message
  detail.style.cssText = 'margin:0;font-size:14px;line-height:1.7;color:#475569;'

  card.append(title, detail)
  wrapper.append(card)
  root.replaceChildren(wrapper)
}

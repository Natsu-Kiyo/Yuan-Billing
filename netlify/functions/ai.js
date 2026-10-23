// Netlify Function：代理智谱 AI 的流式对话接口
// 智谱密钥只保存在服务端环境变量中，前端仅携带 Supabase 访问令牌
const ZHIPU_BASE = 'https://open.bigmodel.cn/api/paas/v4'
const MODEL = process.env.ZHIPU_MODEL || 'glm-4.7-flash'
const MAX_TOKENS = 1024

function json(status, message, extra = {}) {
  return new Response(JSON.stringify({ error: { message }, ...extra }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

/**
 * 校验 Supabase 访问令牌
 * @returns {Promise<{ user: object|null, status: number, reason: string }>}
 */
async function authenticate(request) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) {
    return { user: null, status: 401, reason: '缺少登录凭证' }
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    return {
      user: null,
      status: 500,
      reason: '服务端缺少 SUPABASE_URL / SUPABASE_ANON_KEY 配置',
    }
  }

  let response
  try {
    response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      },
    })
  } catch (err) {
    const code = err?.cause?.code || err?.code || err?.message || 'UNKNOWN'
    return {
      user: null,
      status: 503,
      reason: `无法连接 Supabase 校验登录状态（${code}），请检查服务端出网或代理设置`,
    }
  }

  if (response.status === 401 || response.status === 403) {
    return { user: null, status: 401, reason: '登录状态已失效，请重新登录' }
  }

  if (!response.ok) {
    return { user: null, status: 502, reason: `校验登录状态失败（HTTP ${response.status}）` }
  }

  try {
    const user = await response.json()
    if (!user?.id) {
      return { user: null, status: 401, reason: '登录状态已失效，请重新登录' }
    }
    return { user, status: 200, reason: '' }
  } catch {
    return { user: null, status: 502, reason: '校验登录状态返回了非法响应' }
  }
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return json(405, '仅支持 POST 请求')
  }

  const apiKey = process.env.ZHIPU_API_KEY || process.env.VITE_ZHIPU_API_KEY
  if (!apiKey) {
    return json(500, '服务端未配置 ZHIPU_API_KEY')
  }

  const auth = await authenticate(request)
  if (!auth.user) {
    // 记录到函数日志，便于区分“令牌失效”和“服务端无法访问 Supabase”
    console.error(`[ai] 登录校验失败：${auth.reason}`)
    return json(auth.status, auth.reason)
  }

  let payload
  try {
    payload = await request.json()
  } catch {
    return json(400, '请求体不是合法 JSON')
  }

  if (!Array.isArray(payload?.messages) || payload.messages.length === 0) {
    return json(400, '缺少对话内容')
  }

  // 服务端固定模型与采样参数，避免客户端传入高成本配置
  const body = {
    model: MODEL,
    messages: payload.messages,
    temperature: 0.7,
    max_tokens: MAX_TOKENS,
    thinking: { type: 'disabled' },
    stream: true,
  }

  let upstream
  try {
    upstream = await fetch(`${ZHIPU_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })
  } catch {
    return json(502, '无法连接 AI 服务，请稍后重试')
  }

  if (!upstream.ok) {
    const detail = await upstream.text()
    return new Response(detail, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }

  // 直接透传 SSE 流，前端按 chunk 渲染
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  })
}

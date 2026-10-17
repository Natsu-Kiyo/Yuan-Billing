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

/** 校验 Supabase 访问令牌，返回对应用户；无效时返回 null */
async function authenticate(request) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) return null

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) return null

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
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

  const user = await authenticate(request)
  if (!user) {
    return json(401, '登录状态已失效，请重新登录')
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

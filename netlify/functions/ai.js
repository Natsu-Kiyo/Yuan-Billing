// Netlify Function：代理智谱 AI 的流式对话接口
// 智谱密钥只保存在服务端环境变量中，前端仅携带 Supabase 访问令牌
const ZHIPU_BASE = 'https://open.bigmodel.cn/api/paas/v4'
const PRIMARY_MODEL = process.env.ZHIPU_MODEL || 'glm-4.7-flash'
const MAX_TOKENS = 1024

/** 读取整数环境变量并做范围约束 */
function readIntEnv(name, fallback, min, max) {
  const value = Number.parseInt(process.env[name] ?? '', 10)
  if (Number.isNaN(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

// 429/5xx 重试次数与退避基数，可通过环境变量调整
const MAX_RETRIES = readIntEnv('ZHIPU_MAX_RETRIES', 2, 0, 3)
const RETRY_BASE_DELAY_MS = readIntEnv('ZHIPU_RETRY_DELAY_MS', 1000, 0, 5000)

// 主模型被限流后回退的模型，设置为 off 可关闭
const fallbackEnv = (process.env.ZHIPU_FALLBACK_MODEL ?? 'glm-4-flash').trim()
const FALLBACK_MODEL = ['', 'off', 'none', 'false'].includes(fallbackEnv.toLowerCase())
  ? ''
  : fallbackEnv

function json(status, message, extra = {}) {
  return new Response(JSON.stringify({ error: { message }, ...extra }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function isRetryableStatus(status) {
  return status === 429 || status >= 500
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildRequestBody(model, messages) {
  return JSON.stringify({
    model,
    messages,
    temperature: 0.7,
    max_tokens: MAX_TOKENS,
    thinking: { type: 'disabled' },
    stream: true,
  })
}

/**
 * 调用指定模型；遇到 429/5xx 或网络错误时按退避策略重试
 * 成功时返回 Response，重试耗尽时返回最后一次上游响应
 */
async function requestCompletion({ apiKey, model, messages, retries }) {
  let lastError = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    let response

    try {
      response = await fetch(`${ZHIPU_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: buildRequestBody(model, messages),
      })
    } catch (err) {
      lastError = err

      if (attempt === retries) break

      const delay = RETRY_BASE_DELAY_MS * (attempt + 1)
      console.warn(
        `[ai] ${model} 网络异常（${err?.cause?.code || err?.message}），${delay}ms 后重试`,
      )
      await sleep(delay)
      continue
    }

    if (response.ok) return response

    if (!isRetryableStatus(response.status) || attempt === retries) {
      return response
    }

    const delay = RETRY_BASE_DELAY_MS * (attempt + 1)
    console.warn(
      `[ai] ${model} 返回 ${response.status}，${delay}ms 后重试（${attempt + 1}/${retries}）`,
    )

    // 释放失败响应，避免占用连接
    await response.body?.cancel()
    await sleep(delay)
  }

  throw lastError || new Error('请求 AI 服务失败')
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

  const models = [PRIMARY_MODEL, FALLBACK_MODEL].filter(
    (model, index, list) => model && list.indexOf(model) === index,
  )

  let upstream = null
  let usedModel = PRIMARY_MODEL
  let lastError = null

  for (let index = 0; index < models.length; index++) {
    usedModel = models[index]
    // 主模型按配置重试，回退模型只尝试一次，避免整体耗时过长
    const retries = index === 0 ? MAX_RETRIES : 0

    try {
      upstream = await requestCompletion({
        apiKey,
        model: usedModel,
        messages: payload.messages,
        retries,
      })
    } catch (err) {
      lastError = err
      console.error(`[ai] ${usedModel} 请求失败：${err?.cause?.code || err?.message}`)
      continue
    }

    if (upstream.ok) break

    const canFallback = isRetryableStatus(upstream.status) && index < models.length - 1
    if (!canFallback) break

    console.warn(`[ai] ${usedModel} 返回 ${upstream.status}，回退到 ${models[index + 1]}`)
    await upstream.body?.cancel()
    upstream = null
  }

  if (!upstream) {
    const code = lastError?.cause?.code || lastError?.message
    return json(502, `无法连接 AI 服务${code ? `（${code}）` : ''}，请稍后重试`)
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
      'X-AI-Model': usedModel,
    },
  })
}

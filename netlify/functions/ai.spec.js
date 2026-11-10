import { describe, it, expect, afterEach, vi } from 'vitest'

const AUTH_PATH = '/auth/v1/user'

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function buildRequest() {
  return new Request('https://example.com/.netlify/functions/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token',
    },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
  })
}

function stubBaseEnv() {
  vi.stubEnv('ZHIPU_API_KEY', 'test-key')
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')
  vi.resetModules()
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('netlify ai function', () => {
  it('主模型被限流时重试，仍失败则回退到备用模型', async () => {
    stubBaseEnv()
    vi.stubEnv('ZHIPU_MAX_RETRIES', '1')
    vi.stubEnv('ZHIPU_RETRY_DELAY_MS', '0')
    vi.stubEnv('ZHIPU_FALLBACK_MODEL', 'glm-4-flash')

    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const models = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init = {}) => {
        if (String(url).includes(AUTH_PATH)) {
          return jsonResponse({ id: 'user-1' })
        }

        const body = JSON.parse(init.body)
        models.push(body.model)

        if (models.length <= 2) {
          return jsonResponse({ error: { code: '1305', message: 'busy' } }, 429)
        }

        return new Response('data: {}\n\ndata: [DONE]\n', { status: 200 })
      }),
    )

    const { default: handler } = await import('./ai.js')
    const response = await handler(buildRequest())

    expect(response.status).toBe(200)
    expect(response.headers.get('X-AI-Model')).toBe('glm-4-flash')
    expect(models).toEqual(['glm-4.7-flash', 'glm-4.7-flash', 'glm-4-flash'])

    await response.body?.cancel()
  })

  it('关闭重试与回退时直接返回上游 429', async () => {
    stubBaseEnv()
    vi.stubEnv('ZHIPU_MAX_RETRIES', '0')
    vi.stubEnv('ZHIPU_FALLBACK_MODEL', 'off')

    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    let modelCalls = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (String(url).includes(AUTH_PATH)) {
          return jsonResponse({ id: 'user-1' })
        }

        modelCalls += 1
        return jsonResponse({ error: { code: '1305', message: 'busy' } }, 429)
      }),
    )

    const { default: handler } = await import('./ai.js')
    const response = await handler(buildRequest())

    expect(response.status).toBe(429)
    expect(modelCalls).toBe(1)

    const body = await response.json()
    expect(body.error.message).toBe('busy')
  })

  it('认证失败时不请求模型', async () => {
    stubBaseEnv()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const fetchMock = vi.fn(async (url) => {
      if (String(url).includes(AUTH_PATH)) {
        return jsonResponse({ message: 'invalid token' }, 401)
      }
      return jsonResponse({})
    })
    vi.stubGlobal('fetch', fetchMock)

    const { default: handler } = await import('./ai.js')
    const response = await handler(buildRequest())

    expect(response.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

/**
 * 本地开发时模拟 Netlify Functions：
 * 让 /.netlify/functions/* 请求直接调用 netlify/functions 下的处理函数，
 * 保证本地与线上走同一条服务端代理链路。
 */
function netlifyFunctionsDev() {
  const prefix = '/.netlify/functions/'

  return {
    name: 'netlify-functions-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith(prefix)) return next()

        const name = req.url.slice(prefix.length).split('?')[0]
        if (!name) return next()

        try {
          const mod = await server.ssrLoadModule(`/netlify/functions/${name}.js`)

          const headers = new Headers()
          for (const [key, value] of Object.entries(req.headers)) {
            if (value) headers.set(key, Array.isArray(value) ? value.join(',') : value)
          }

          const chunks = []
          for await (const chunk of req) chunks.push(chunk)

          const request = new Request(`http://${req.headers.host}${req.url}`, {
            method: req.method,
            headers,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          })

          const response = await mod.default(request, {})
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))

          if (!response.body) {
            res.end()
            return
          }

          res.flushHeaders?.()
          const reader = response.body.getReader()
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(Buffer.from(value))
          }
          res.end()
        } catch (err) {
          server.config.logger.error(`[netlify-function:${name}] ${err?.stack || err}`)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
          }
          res.end(JSON.stringify({ error: { message: '函数执行失败' } }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // 将 .env 中的变量注入 process.env，供本地模拟的 Netlify Function 读取
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [
      vue(),
      vueDevTools(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      netlifyFunctionsDev(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          additionalData: `@import "@/assets/styles/variables.less";`,
          javascriptEnabled: true,
        },
      },
    },
  }
})

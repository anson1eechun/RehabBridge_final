import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const openAiKey = env.OPENAI_API_KEY?.trim()
  const yatingKey = env.YATING_API_KEY?.trim()

  const proxy: Record<string, object> = {}
  if (openAiKey) {
    proxy['/api/openai'] = {
      target: 'https://api.openai.com',
      changeOrigin: true,
      rewrite: (p: string) => p.replace(/^\/api\/openai/, ''),
      configure: (proxyServer) => {
        proxyServer.on('proxyReq', (proxyReq) => {
          proxyReq.setHeader('Authorization', `Bearer ${openAiKey}`)
        })
      },
    }
  }
  if (yatingKey) {
    proxy['/api/yating'] = {
      target: 'https://tts.api.yating.tw',
      changeOrigin: true,
      rewrite: (p: string) => p.replace(/^\/api\/yating/, ''),
      configure: (proxyServer) => {
        proxyServer.on('proxyReq', (proxyReq) => {
          proxyReq.setHeader('key', yatingKey)
        })
      },
    }
  }

  return {
    define: {
      __REHAB_OPENAI_PROXY__: JSON.stringify(Boolean(openAiKey)),
      __REHAB_YATING_PROXY__: JSON.stringify(Boolean(yatingKey)),
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
    server: {
      proxy,
    },
  }
})

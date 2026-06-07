import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/chat': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: () => '/v1/chat/completions',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const key = process.env.VITE_DEEPSEEK_API_KEY
            if (key) proxyReq.setHeader('Authorization', `Bearer ${key}`)
          })
        },
      },
      '/api/generate': {
        target: 'https://api.kie.ai',
        changeOrigin: true,
        rewrite: () => '/api/v1/flux/kontext/generate',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const key = process.env.VITE_KIE_API_KEY
            if (key) proxyReq.setHeader('Authorization', `Bearer ${key}`)
          })
        },
      },
      '/api/poll': {
        target: 'https://api.kie.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/poll', '/api/v1/flux/kontext/record-info'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const key = process.env.VITE_KIE_API_KEY
            if (key) proxyReq.setHeader('Authorization', `Bearer ${key}`)
          })
        },
      },
    },
  },
})

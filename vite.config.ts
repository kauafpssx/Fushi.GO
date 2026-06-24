import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_API_URL || 'http://localhost:47291'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': backendUrl,
        '/v1': backendUrl,
        '/live': backendUrl,
      },
    },
  }
})

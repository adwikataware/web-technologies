import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// /api is proxied to Spring Boot so the browser only ever talks to one origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})

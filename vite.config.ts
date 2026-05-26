import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Proxy /api → real backend in dev so the browser never sees a cross-origin
  // request (avoids CORS issues when developing against the deployed API).
  // Resolve VITE_API_URL down to its origin — the front-end keeps using
  // `/api/...` paths and Vite forwards them with the prefix preserved.
  const apiUrl = env.VITE_API_URL ?? 'http://localhost:3000/api'
  const apiOrigin = apiUrl.replace(/\/api\/?$/, '') || 'http://localhost:3000'
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      // Pin a single React instance for the entire dep graph. Without this,
      // Vite's lazy optimizer can occasionally hand a different cached React
      // copy to dynamically-imported chunks (e.g. jspdf/html2canvas worker
      // helpers), which triggers "Invalid hook call / useState is null" in
      // components that load BEFORE the dynamic chunk resolves.
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      // Pre-bundle these heavy libs up-front so Vite doesn't re-optimize on
      // first user click — that mid-flight re-optimization is what corrupted
      // React's single-instance invariant after `npm install`.
      include: ['jspdf', 'html2canvas'],
    },
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
          secure: true,
          // better-auth validates Origin/Referer — rewrite them so the
          // backend sees its own origin instead of the dev server's.
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Origin', apiOrigin)
              proxyReq.setHeader('Referer', apiOrigin + '/')
            })
          },
        },
      },
    },
  }
})

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env names (including HT_*) so we can selectively expose public ones.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    base: '/',
    // Only URL + publishable key are embedded in the client — never the secret.
    // Accept HT_*, VITE_*, and plain SUPABASE_* (as set in Vercel).
    define: {
      'import.meta.env.HT_SUPABASE_PROJECT_URL': JSON.stringify(
        env.HT_SUPABASE_PROJECT_URL ||
          env.SUPABASE_URL ||
          env.SUPABASE_PROJECT_URL ||
          env.VITE_SUPABASE_URL ||
          '',
      ),
      'import.meta.env.HT_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(
        env.HT_SUPABASE_PUBLISHABLE_KEY ||
          env.SUPABASE_PUBLISHABLE_KEY ||
          env.SUPABASE_ANON_KEY ||
          env.VITE_SUPABASE_PUBLISHABLE_KEY ||
          env.VITE_SUPABASE_ANON_KEY ||
          '',
      ),
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Client + SSR-entry bundling. The Express + Socket.IO server is NOT bundled by
// Vite — it runs via tsx (dev: middleware mode, prod: serves dist/client).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@client': fileURLToPath(new URL('./src/client', import.meta.url)),
    },
  },
  build: {
    emptyOutDir: true,
  },
})

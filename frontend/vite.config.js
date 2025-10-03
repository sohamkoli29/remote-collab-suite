import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'fabric',
          '@tiptap/core',
      '@tiptap/starter-kit',
      '@tiptap/react',
      '@tiptap/extension-collaboration',
      '@tiptap/extension-collaboration-cursor',
      'yjs',
      'y-prosemirror'
  ],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js'
  }
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/@monaco-editor')) return 'monaco';
          if (id.includes('node_modules/katex')) return 'katex';
          if (id.includes('node_modules/react-syntax-highlighter')) return 'syntax-highlighter';
          if (id.includes('node_modules/react-markdown') || id.includes('node_modules/rehype') || id.includes('node_modules/remark')) return 'markdown';
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})

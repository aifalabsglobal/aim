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
          const norm = id.replace(/\\/g, '/');
          if (norm.includes('node_modules/@monaco-editor')) return 'monaco';
          if (norm.includes('node_modules/katex')) return 'katex';
          if (norm.includes('node_modules/react-syntax-highlighter')) return 'syntax-highlighter';
          if (norm.includes('node_modules/react-markdown') || norm.includes('node_modules/rehype') || norm.includes('node_modules/remark')) return 'markdown';
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

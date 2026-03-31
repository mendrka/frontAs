import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@context': resolve(__dirname, './src/context'),
      '@config': resolve(__dirname, './src/config'),
      '@services': resolve(__dirname, './src/services'),
      '@data': resolve(__dirname, './src/data'),
      '@layouts': resolve(__dirname, './src/layouts'),
      '@utils': resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy API vers le backend Express en développement
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Proxy Socket.io vers le backend
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('src/data/lessonCatalog')) return 'lessons-data'
          if (id.includes('src/components/cours/AudioPlayer') || id.includes('src/components/sprechen/MicrophoneRecorder')) {
            return 'media-tools'
          }

          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('\\react\\') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom')
            ) {
              return 'vendor-react'
            }

            if (id.includes('chart.js')) return 'guide-charts'
            if (id.includes('framer-motion')) return 'sprechen-motion'
            if (id.includes('recharts')) return 'sprechen-charts'
            if (id.includes('socket.io-client')) return 'vendor-realtime'
          }

          if (id.includes('src/components/chat/Guide') || id.includes('src/pages/Guide')) {
            return 'guide'
          }

          if (id.includes('src/components/sprechen') || id.includes('src/pages/Sprechen')) {
            return 'sprechen'
          }

          if (id.includes('src/components/chat') || id.includes('src/pages/Communaute')) {
            return 'chat'
          }

          if (id.includes('src/pages/Dashboard')) {
            return 'dashboard'
          }

          if (id.includes('src/components/cours') || id.includes('src/pages/Cours') || id.includes('src/pages/Lecon')) {
            return 'cours'
          }

          return undefined
        },
      },
    },
  },
})

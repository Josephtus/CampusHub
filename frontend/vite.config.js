import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Docker dışından erişim için şart
    port: 5173,
    watch: {
      usePolling: true // Windows/Docker dosya değişim takibi için önemli
    }
  },
  resolve: {
    alias: {
      // Bazen import yollarında karışıklık olabiliyor
      '@': '/src',
    },
  },
})
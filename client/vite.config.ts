import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno según el modo
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    // Definir variables globales en tiempo de compilación
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(
        env.VITE_API_URL || '/api'
      ),
      'import.meta.env.VITE_WHATSAPP_PHONE': JSON.stringify(
        env.VITE_WHATSAPP_PHONE || '51980656823'
      ),
    },

    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true
        },
        "/uploads": {
          target: "http://localhost:3000",
          changeOrigin: true
        }
      }
    }
  }
})

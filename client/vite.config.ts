import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cambia el puerto si tu API corre en otro
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      }
    }
  }
})

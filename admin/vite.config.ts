import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@types': resolve(__dirname, '../src/types'),
    },
  },
  build: {
    outDir: 'dist',
  },
  envDir: '../', // lê .env.local da raiz do projeto
})

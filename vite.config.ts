import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base: works on GitHub Pages under /<repo>/, on a custom domain, or any static host.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2020', chunkSizeWarningLimit: 1600 },
})

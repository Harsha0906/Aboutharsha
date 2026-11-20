import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base: works on GitHub Pages under /<repo>/, on a custom domain, or any static host.
export default defineConfig({
  base: './',
  plugins: [react()],
  // only scan the portfolio itself, not the bundled games in public/play
  optimizeDeps: { entries: ['index.html'] },
  // ignore any PostCSS/Tailwind config sitting in a parent folder
  css: { postcss: { plugins: [] } },
  build: { target: 'es2020', chunkSizeWarningLimit: 1600 },
})

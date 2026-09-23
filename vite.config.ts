import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import posts from './plugins/posts.ts'

export default defineConfig({
  // Relative base so the build works at any GitHub Pages path (user.github.io/<repo>/ or a custom domain).
  base: './',
  plugins: [react(), posts()],
  // Preact's React-compatible runtime keeps the bundle ~4× smaller than react-dom.
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom/client': 'preact/compat/client',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
      'react/jsx-dev-runtime': 'preact/jsx-runtime',
    },
  },
})

import react from 'eslint-config/react'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...react,
  {
    // Frontend-specific ignores
    ignores: [
      '*.config.js',     // Vite, Tailwind, PostCSS configs
      '*.config.mjs',
      'dist/**',
    ],
  },
])

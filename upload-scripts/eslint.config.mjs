import node from 'eslint-config/node'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...node,
  {
    // Upload-scripts specific ignores
    ignores: ['data/**', 'mplads-image-extractor/**'],
  },
  {
    // Override console rule to allow all console methods in scripts
    rules: {
      'no-console': 'off',
    },
  },
])


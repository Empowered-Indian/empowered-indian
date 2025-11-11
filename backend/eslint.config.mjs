import node from 'eslint-config/node'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...node,
  {
    // Backend-specific ignores (already in node config, but can add more if needed)
    ignores: ['logs/**'],
  },
])

import js from '@eslint/js'
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['node_modules', 'logs', 'data', 'mplads-image-extractor']),
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**', 'logs/**', 'data/**', 'mplads-image-extractor/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'eqeqeq': ['error', 'always'],
      'no-undef': 'error',
    },
    extends: [js.configs.recommended],
  },
])


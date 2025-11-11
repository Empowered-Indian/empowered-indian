import js from '@eslint/js'

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/logs/**',
      '**/data/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/eslint.config.*',  // Matches eslint.config.js, eslint.config.mjs, eslint.config.cjs, etc.
    ],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_', 
        varsIgnorePattern: '^_' 
      }],
      'eqeqeq': ['error', 'always'],
      'no-undef': 'error',
    },
  },
]
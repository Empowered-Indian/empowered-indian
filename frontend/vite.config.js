import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    minify: mode === 'production',
    chunkSizeWarningLimit: 500, // Warn for chunks > 500KB
    rollupOptions: {
      output: {
        manualChunks: id => {
          // Optimize chunking strategy
          if (id.includes('node_modules')) {
            // Router - check BEFORE react to avoid mismatching
            if (id.includes('react-router')) {
              return 'router'
            }
            // Data fetching - check BEFORE react to avoid mismatching
            if (id.includes('@tanstack/react-query')) {
              return 'query'
            }
            // Icons - check BEFORE react to avoid mismatching
            if (id.includes('react-icons')) {
              return 'icons'
            }
            // Hot toast - check BEFORE react to avoid mismatching
            if (id.includes('react-hot-toast')) {
              return 'vendor'
            }
            // Radix UI components - check BEFORE react to avoid mismatching
            if (id.includes('@radix-ui')) {
              return 'vendor'
            }
            // Core React libs - keep all React modules unified
            // Use more specific matching to avoid catching react-* packages
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('scheduler')
            ) {
              return 'react-vendor'
            }
            // ECharts - optimized with tree-shaking
            if (id.includes('echarts')) {
              return 'charts'
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-utils'
            }
            // API client
            if (id.includes('axios')) {
              return 'api-client'
            }
            // Other vendor libs
            return 'vendor'
          }
        },
        // Optimize asset names
        assetFileNames: assetInfo => {
          const info = assetInfo.name.split('.')
          const extType = info[info.length - 1]
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (extType === 'css') {
            return `assets/styles/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Optimize build performance
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'date-fns',
    ],
    exclude: ['echarts'], // Let our custom config handle echarts
  },
}))

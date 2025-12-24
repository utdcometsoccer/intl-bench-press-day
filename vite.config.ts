import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['IBPD-FINAL.png', 'vite.svg'],
      manifest: {
        name: 'International Bench Press Day',
        short_name: 'IBPD',
        description: 'A comprehensive fitness tracking app for strength training with 5-3-1 workout planning, exercise tracking, and progress visualization.',
        theme_color: '#007bff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'IBPD-FINAL.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ],
        categories: ['fitness', 'health', 'sports', 'productivity'],
        screenshots: [
          {
            src: 'IBPD-FINAL.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'recharts-vendor': ['recharts'],
          'date-fns-vendor': ['date-fns'],
          'applicationinsights-vendor': [
            '@microsoft/applicationinsights-react-js',
            '@microsoft/applicationinsights-web'
          ]
        }
      }
    }
  }
})

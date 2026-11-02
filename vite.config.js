import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'sinar-pagi-icon-color.svg', 
        'sinar-pagi-icon-color-2048.png', 
        'sinar-pagi-color-2048.png', 
        'robots.txt'
      ],
      manifest: {
        name: 'Warung Sinar Pagi',
        short_name: 'SinarPagi',
        description: 'Katalog Online & Belanja Praktis Warung Sinar Pagi',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/sinar-pagi-icon-color-2048.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/sinar-pagi-icon-color-2048.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/sinar-pagi-icon-color-2048.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        mode: 'development', // INI FIX FINAL BIAR GAK ERROR TERSER DI ACODE
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,xml,txt}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-product-images',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Hari
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 15 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
  }
})

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.png',
        'favicon-16.png',
        'favicon-48.png',
        'apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png'
      ],
      manifest: {
        name: 'Meal Planner PWA',
        short_name: 'Meal Planner',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  server: {
    allowedHosts: true,
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://pocketbase:8080',
	changeOrigin: true
      },
      '/_/': {
        target: 'http://pocketbase:8080',
	changeOrigin: true
      }
    }
  }
})

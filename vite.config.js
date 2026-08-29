import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages のプロジェクトサイト用のベースパス（= リポジトリ名）。
// リポジトリ名を変更した場合はこの1行だけ直す。
// ルートドメイン（ユーザーサイトやカスタムドメイン）で配信する場合は '/' にする。
const BASE_PATH = '/koekare/'

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'コエカレ',
        short_name: 'コエカレ',
        description: '音声で予定を入力できるカレンダー',
        lang: 'ja',
        dir: 'ltr',
        display: 'standalone',
        orientation: 'portrait',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
})

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

/** 生成り（背景色）。起動画面やステータスバーの色に使う */
const BACKGROUND = '#f4eee1'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages では https://inz125.github.io/100castles_v2/ に置かれる
  base: '/100castles_v2/',
  plugins: [
    react(),
    VitePWA({
      // 新しい版は自動では切り替えず、ポップアップの「更新」で切り替える（D-08）
      registerType: 'prompt',
      manifest: {
        name: '100名城スタンプ帳',
        short_name: '100名城',
        description: '日本100名城の押印記録をつけるスタンプ帳',
        lang: 'ja',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: BACKGROUND,
        theme_color: BACKGROUND,
        icons: [
          { src: 'icons/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          // 印は中央の安全領域に収めてあるので、同じ画像をマスカブルアイコンにも使う
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // アプリ本体をすべてキャッシュし、電波がなくても使えるようにする
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    // Firestore エミュレータにつなぐテストは npm run test:emulator で別に実行する
    exclude: [...configDefaults.exclude, 'src/**/*.emulator.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    // 日付の扱いを実際の利用環境（日本）と同じ条件でテストする
    env: { TZ: 'Asia/Tokyo' },
    // 毎回ランダムな順で実行し、テスト同士が順番に依存していないことを確かめる
    sequence: { shuffle: true },
  },
})

/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // 日付の扱いを実際の利用環境（日本）と同じ条件でテストする
    env: { TZ: 'Asia/Tokyo' },
  },
})

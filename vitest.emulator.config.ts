import { defineConfig } from 'vitest/config'

/**
 * Firestore エミュレータにつなぐテスト（npm run test:emulator で、エミュレータを起動してから実行する）。
 * 通常のテスト（npm test）には含めない
 */
export default defineConfig({
  test: {
    include: ['src/**/*.emulator.test.ts'],
    environment: 'node',
    env: { TZ: 'Asia/Tokyo' },
    testTimeout: 20_000,
    // 同じエミュレータを使うので、ファイルごとに順番に実行する
    fileParallelism: false,
  },
})

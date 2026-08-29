import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // 既定は node（純粋ロジック・ストアのテスト用、高速）。
    // React コンポーネントのテストはファイル先頭に `// @vitest-environment jsdom` を付ける。
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    passWithNoTests: true,
    // 日時テストは固定タイムゾーンで実行する（CI は UTC のため）。
    env: { TZ: 'Asia/Tokyo' },
  },
})

import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { deleteDB } from 'idb'
import { closeDB, DB_NAME } from './src/store/db.js'

// 各テスト後にReactツリー（jsdom環境のみ）とIndexedDBを破棄し、状態を持ち越さない。
afterEach(async () => {
  if (typeof document !== 'undefined') {
    const { cleanup } = await import('@testing-library/react')
    cleanup()
  }
  await closeDB()
  try {
    await deleteDB(DB_NAME)
  } catch {
    // データベース未作成なら無視
  }
})

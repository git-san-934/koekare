import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { deleteDB } from 'idb'

// 各テスト後にReactツリーとIndexedDBを破棄し、テスト間の状態を持ち越さない。
afterEach(async () => {
  cleanup()
  try {
    await deleteDB('koekare')
  } catch {
    // データベース未作成なら無視
  }
})

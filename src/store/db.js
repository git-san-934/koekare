import { openDB } from 'idb'

export const DB_NAME = 'koekare'
const DB_VERSION = 1

let dbPromise = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('events')) {
          const events = db.createObjectStore('events', { keyPath: 'id' })
          events.createIndex('by_start', 'startAt')
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

// テストや復元処理で接続を明示的に閉じ、シングルトンを破棄する。
export async function closeDB() {
  if (dbPromise) {
    const db = await dbPromise
    db.close()
    dbPromise = null
  }
}

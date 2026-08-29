// 予定の永続化。UI 側はこのインターフェース（add/update/remove/get/list/bulkPut）
// だけに依存し、保存先の差し替え（将来のクラウド同期など）を可能にする。
import { getDB } from './db.js'
import { createEvent, applyChanges } from '../domain/event.js'
import { getSettings } from './settingsStore.js'
import { toISO } from '../datetime.js'

export async function add(input, { now } = {}) {
  const settings = await getSettings()
  const event = createEvent(input, { settings, now })
  const db = await getDB()
  await db.put('events', event)
  return event
}

export async function update(id, changes, { now } = {}) {
  const db = await getDB()
  const existing = await db.get('events', id)
  if (!existing) throw new Error('予定が見つかりません')
  const updated = applyChanges(existing, changes, { now })
  await db.put('events', updated)
  return updated
}

export async function remove(id) {
  const db = await getDB()
  await db.delete('events', id)
}

export async function get(id) {
  const db = await getDB()
  return db.get('events', id)
}

// range を渡すと by_start インデックスで [from, to) を範囲検索する。
// range 省略時は全件を startAt 昇順で返す。
export async function list({ from, to } = {}) {
  const db = await getDB()
  if (from && to) {
    const range = IDBKeyRange.bound(toISO(from), toISO(to), false, true)
    return db.getAllFromIndex('events', 'by_start', range)
  }
  const all = await db.getAll('events')
  return all.sort(byStartAsc)
}

export async function bulkPut(events) {
  const db = await getDB()
  const tx = db.transaction('events', 'readwrite')
  for (const event of events) {
    tx.store.put(event)
  }
  await tx.done
}

function byStartAsc(a, b) {
  if (a.startAt < b.startAt) return -1
  if (a.startAt > b.startAt) return 1
  return 0
}

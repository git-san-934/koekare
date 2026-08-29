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

// range を渡すと [from, to) と「期間が重なる」予定を返す（複数日の終日予定も
// 各日で拾えるようにするため、単純な開始日時の範囲検索ではなく重なり判定する）。
// range 省略時は全件を startAt 昇順で返す。
export async function list({ from, to } = {}) {
  const db = await getDB()
  if (from && to) {
    const fromISO = toISO(from)
    const toISOValue = toISO(to)
    // startAt < to の候補を取り、endAt > from で絞る
    const candidates = await db.getAllFromIndex(
      'events',
      'by_start',
      IDBKeyRange.upperBound(toISOValue, true),
    )
    return candidates.filter((event) => event.endAt > fromISO).sort(byStartAsc)
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

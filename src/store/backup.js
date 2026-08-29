// 予定データの書き出し（JSON）と読み込み（検証つき）。
// 検証に失敗した場合は既存データを一切変更しない。
import * as eventStore from './eventStore.js'
import { fromISO, isValidDate, formatISODate, toISO } from '../datetime.js'

export const SCHEMA_VERSION = 1
const APP_ID = 'koekare'
const REQUIRED_KEYS = ['id', 'title', 'startAt', 'endAt']

export class BackupError extends Error {
  constructor(message) {
    super(message)
    this.name = 'BackupError'
  }
}

function pickEventFields(event) {
  return {
    id: event.id,
    title: event.title,
    startAt: event.startAt,
    endAt: event.endAt,
    allDay: Boolean(event.allDay),
    source: event.source === 'voice' ? 'voice' : 'manual',
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  }
}

function byStartAsc(a, b) {
  if (a.startAt < b.startAt) return -1
  if (a.startAt > b.startAt) return 1
  return 0
}

export function buildBackup(events) {
  return {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: toISO(new Date()),
    events: [...events].sort(byStartAsc).map(pickEventFields),
  }
}

export function toDownload(backup) {
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const stamp = formatISODate(new Date()).replace(/-/g, '')
  return { blob, filename: `koekare-backup-${stamp}.json` }
}

function validateRecord(raw, index) {
  const position = `${index + 1}件目の予定`
  if (!raw || typeof raw !== 'object') {
    throw new BackupError(`${position}が不正です`)
  }
  for (const key of REQUIRED_KEYS) {
    if (typeof raw[key] !== 'string' || raw[key] === '') {
      throw new BackupError(`${position}に「${key}」がありません`)
    }
  }
  const start = fromISO(raw.startAt)
  const end = fromISO(raw.endAt)
  if (!isValidDate(start) || !isValidDate(end)) {
    throw new BackupError(`${position}の日時が不正です`)
  }
  if (end.getTime() < start.getTime()) {
    throw new BackupError(`${position}の終了が開始より前です`)
  }
  return {
    id: raw.id,
    title: raw.title,
    startAt: raw.startAt,
    endAt: raw.endAt,
    allDay: Boolean(raw.allDay),
    source: raw.source === 'voice' ? 'voice' : 'manual',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : raw.startAt,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : raw.startAt,
  }
}

// 検証を通過した Event 配列を返す。1件でも不正なら BackupError を投げる（副作用なし）。
export function parseBackup(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new BackupError('ファイルを読み込めませんでした（形式が正しくありません）')
  }
  if (!data || typeof data !== 'object' || data.app !== APP_ID) {
    throw new BackupError('コエカレの書き出しファイルではありません')
  }
  if (data.schemaVersion !== SCHEMA_VERSION) {
    throw new BackupError(`対応していない形式です（バージョン ${data.schemaVersion}）`)
  }
  if (!Array.isArray(data.events)) {
    throw new BackupError('予定データが見つかりません')
  }
  return data.events.map(validateRecord)
}

export async function exportEvents() {
  const events = await eventStore.list()
  return toDownload(buildBackup(events))
}

// 全予定を JSON ファイルとしてダウンロードさせる（ブラウザ環境専用）。
export async function saveEventsToFile() {
  const { blob, filename } = await exportEvents()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return filename
}

// 同一 id は読み込み側で上書き（merge）。検証失敗時は書き込みゼロ。
export async function importEvents(text) {
  const events = parseBackup(text)
  await eventStore.bulkPut(events)
  return { imported: events.length }
}

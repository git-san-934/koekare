// 予定（Event）の生成・変更・検証。ブラウザAPI・Reactに依存しない純粋ロジック。
import {
  toISO,
  fromISO,
  isValidDate,
  addMinutes,
  addDays,
  startOfDayLocal,
} from '../datetime.js'
import { DEFAULT_DURATION_MINUTES } from './settings.js'

export class ValidationError extends Error {
  constructor(errors) {
    super(errors.join(' / '))
    this.name = 'ValidationError'
    this.errors = errors
  }
}

// 妥当なら空配列、そうでなければ日本語エラーメッセージの配列を返す。
export function validateEvent(event) {
  const errors = []
  if (!event || typeof event.title !== 'string' || event.title.trim() === '') {
    errors.push('タイトルを入力してください')
  }
  const start = fromISO(event?.startAt)
  const end = fromISO(event?.endAt)
  if (!isValidDate(start)) errors.push('開始日時が正しくありません')
  if (!isValidDate(end)) errors.push('終了日時が正しくありません')
  if (isValidDate(start) && isValidDate(end) && end.getTime() < start.getTime()) {
    errors.push('終了は開始より後にしてください')
  }
  return errors
}

function resolveDuration(settings) {
  const value = settings?.defaultDurationMinutes
  return typeof value === 'number' && Number.isFinite(value) ? value : DEFAULT_DURATION_MINUTES
}

// 終日予定は startAt=その日0:00、endAt=翌日0:00 に正規化する。
function normalizeAllDay(startAt) {
  const day = startOfDayLocal(fromISO(startAt))
  return { startAt: toISO(day), endAt: toISO(addDays(day, 1)) }
}

export function createEvent(input, { settings, now = new Date() } = {}) {
  const allDay = Boolean(input.allDay)
  let startAt = input.startAt
  let endAt = input.endAt

  if (allDay && isValidDate(fromISO(startAt))) {
    ;({ startAt, endAt } = normalizeAllDay(startAt))
  } else if (!endAt && isValidDate(fromISO(startAt))) {
    endAt = toISO(addMinutes(fromISO(startAt), resolveDuration(settings)))
  }

  const nowISO = toISO(now)
  const event = {
    id: crypto.randomUUID(),
    title: (input.title ?? '').trim(),
    startAt,
    endAt,
    allDay,
    source: input.source === 'voice' ? 'voice' : 'manual',
    createdAt: nowISO,
    updatedAt: nowISO,
  }

  const errors = validateEvent(event)
  if (errors.length > 0) throw new ValidationError(errors)
  return event
}

export function applyChanges(event, changes, { now = new Date() } = {}) {
  const merged = { ...event, ...changes }
  merged.allDay = Boolean(merged.allDay)
  merged.title = (merged.title ?? '').trim()

  if (merged.allDay && isValidDate(fromISO(merged.startAt))) {
    ;({ startAt: merged.startAt, endAt: merged.endAt } = normalizeAllDay(merged.startAt))
  }

  merged.updatedAt = toISO(now)
  // 変更してはいけない項目は元の値を維持する
  merged.id = event.id
  merged.source = event.source
  merged.createdAt = event.createdAt

  const errors = validateEvent(merged)
  if (errors.length > 0) throw new ValidationError(errors)
  return merged
}

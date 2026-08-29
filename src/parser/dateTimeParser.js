// 認識テキスト → { startAt?, endAt?, allDay?, dateOnly?, title?, transcript }
import { normalize } from './normalize.js'
import { extractDate } from './rules/dateRules.js'
import { extractTime } from './rules/timeRules.js'
import { extractDuration } from './rules/durationRules.js'
import { withDefaults } from '../domain/settings.js'
import {
  setTime,
  addMinutes,
  addDays,
  startOfDayLocal,
  formatISODate,
  toISO,
} from '../datetime.js'

const EDGE_PARTICLES = /^[のにへではをがからまで、。・､｡\s]+|[のにへではをがからまで、。・､｡\s]+$/g

function stripSpans(text, spans) {
  let remaining = text
  for (const span of spans) {
    if (span) remaining = remaining.replace(span, ' ')
  }
  remaining = remaining.replace(/\s+/g, ' ').trim()
  // 端に残った助詞・記号を繰り返し落とす
  let previous
  do {
    previous = remaining
    remaining = remaining.replace(EDGE_PARTICLES, '').trim()
  } while (remaining !== previous)
  return remaining
}

export function parseDateTime(rawText, { now = new Date(), settings } = {}) {
  const text = normalize(rawText)
  const resolvedSettings = withDefaults(settings)

  const date = extractDate(text, { now })
  const time = extractTime(text, { settings: resolvedSettings })
  const duration = extractDuration(text)

  const title = stripSpans(text, [...date.spans, ...time.spans, ...duration.spans])

  const result = { transcript: rawText }
  if (title) result.title = title

  const hasDate = date.date instanceof Date
  const hasTime = typeof time.hour === 'number'

  if (duration.allDay && hasDate) {
    const day = startOfDayLocal(date.date)
    result.allDay = true
    result.startAt = toISO(day)
    result.endAt = toISO(addDays(day, 1))
    return result
  }

  if (hasDate && hasTime) {
    const start = setTime(date.date, time.hour, time.minute ?? 0)
    let end
    if (typeof duration.endHour === 'number') {
      end = setTime(date.date, duration.endHour, duration.endMinute ?? 0)
      if (end.getTime() <= start.getTime()) {
        end = addMinutes(start, resolvedSettings.defaultDurationMinutes)
      }
    } else if (typeof duration.durationMinutes === 'number') {
      end = addMinutes(start, duration.durationMinutes)
    } else {
      end = addMinutes(start, resolvedSettings.defaultDurationMinutes)
    }
    result.startAt = toISO(start)
    result.endAt = toISO(end)
    return result
  }

  if (hasDate && !hasTime) {
    // 日付だけ取れた場合。フォームの初期日付に使う。
    result.dateOnly = formatISODate(date.date)
  }

  return result
}

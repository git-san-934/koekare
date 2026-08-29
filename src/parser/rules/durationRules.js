// 認識テキストから終了時刻・所要時間・終日を推測する。
// docs/functional-design.md「期間・時刻範囲の対応範囲」に対応。

// normalize 後は漢数字が算用数字になる（「一日中」→「1日中」）ため両形を許容する。
const ALL_DAY_PATTERN = /終日|1日中|一日中|丸1日|丸一日|まる1日/
const RANGE_END_PATTERN = /から(\d{1,2})時(?:(\d{1,2})分|(半))?(?:まで)?/
const HOURS_PATTERN = /(\d{1,2})時間(半)?/
const MINUTES_PATTERN = /(\d{1,2})分間/

export function extractDuration(text) {
  const spans = []
  const result = {}

  if (ALL_DAY_PATTERN.test(text)) {
    result.allDay = true
    spans.push(text.match(ALL_DAY_PATTERN)[0])
    return { ...result, spans }
  }

  const range = text.match(RANGE_END_PATTERN)
  if (range) {
    const hour = Number(range[1])
    const minute = range[2] ? Number(range[2]) : range[3] ? 30 : 0
    if (hour <= 23 && minute <= 59) {
      result.endHour = hour
      result.endMinute = minute
      spans.push(range[0])
      return { ...result, spans }
    }
  }

  const hours = text.match(HOURS_PATTERN)
  if (hours) {
    result.durationMinutes = Number(hours[1]) * 60 + (hours[2] ? 30 : 0)
    spans.push(hours[0])
    return { ...result, spans }
  }

  const minutes = text.match(MINUTES_PATTERN)
  if (minutes) {
    result.durationMinutes = Number(minutes[1])
    spans.push(minutes[0])
    return { ...result, spans }
  }

  return { spans }
}

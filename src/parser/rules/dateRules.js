// 認識テキストから日付を推測する。docs/functional-design.md「日付表現の対応範囲」に対応。
import {
  startOfDayLocal,
  startOfWeekLocal,
  addDays,
  localDate,
  nextOccurrenceOfWeekday,
  upcomingSaturday,
} from '../../datetime.js'

const WEEKDAY_INDEX = { 日: 0, 月: 1, 火: 2, 水: 3, 木: 4, 金: 5, 土: 6 }

function nextWeekWeekday(base, weekday) {
  const nextWeekSunday = addDays(startOfWeekLocal(base), 7)
  return addDays(nextWeekSunday, weekday)
}

// 上から順に評価し、最初に一致したものを採用する（具体的な表現ほど先に置く）。
const RULES = [
  {
    pattern: /明々後日|明明後日|しあさって/,
    resolve: (_m, base) => addDays(base, 3),
  },
  {
    pattern: /明後日|あさって/,
    resolve: (_m, base) => addDays(base, 2),
  },
  {
    pattern: /明日|あした|あす|みょうにち/,
    resolve: (_m, base) => addDays(base, 1),
  },
  {
    pattern: /今日|本日|きょう/,
    resolve: (_m, base) => base,
  },
  {
    pattern: /来週の?([日月火水木金土])曜日?/,
    resolve: (m, base) => nextWeekWeekday(base, WEEKDAY_INDEX[m[1]]),
  },
  {
    pattern: /来週/,
    resolve: (_m, base) => nextWeekWeekday(base, 1),
  },
  {
    pattern: /今週末|週末/,
    resolve: (_m, base) => upcomingSaturday(base),
  },
  {
    pattern: /今週の?([日月火水木金土])曜日?/,
    resolve: (m, base) => nextOccurrenceOfWeekday(base, WEEKDAY_INDEX[m[1]], { allowToday: true }),
  },
  {
    pattern: /(\d{1,2})月(\d{1,2})日?/,
    resolve: (m, base) => {
      const month = Number(m[1]) - 1
      const day = Number(m[2])
      let candidate = localDate(base.getFullYear(), month, day)
      if (candidate < base) candidate = localDate(base.getFullYear() + 1, month, day)
      return candidate
    },
  },
  {
    pattern: /(\d{1,2})日/,
    resolve: (m, base) => {
      const day = Number(m[1])
      let candidate = localDate(base.getFullYear(), base.getMonth(), day)
      if (candidate < base) candidate = localDate(base.getFullYear(), base.getMonth() + 1, day)
      return candidate
    },
  },
  {
    pattern: /([日月火水木金土])曜日?/,
    resolve: (m, base) => nextOccurrenceOfWeekday(base, WEEKDAY_INDEX[m[1]], { allowToday: false }),
  },
]

export function extractDate(text, { now }) {
  const base = startOfDayLocal(now)
  for (const rule of RULES) {
    const match = text.match(rule.pattern)
    if (match) {
      const date = rule.resolve(match, base)
      if (date instanceof Date && !Number.isNaN(date.getTime())) {
        return { date, spans: [match[0]] }
      }
    }
  }
  return { date: null, spans: [] }
}

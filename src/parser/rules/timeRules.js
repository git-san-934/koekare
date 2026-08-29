// 認識テキストから開始時刻を推測する。docs/functional-design.md「時刻・時間帯表現の対応範囲」に対応。

const AM_PREFIXES = new Set(['午前', '朝'])
const PM_PREFIXES = new Set(['午後', '夕方', '夕', '夜', '晩'])

// 「(午前|午後|朝|夕方|夜)?◯時(◯分|半)?」
const CLOCK_PATTERN = /(午前|午後|夕方|夕|夜|晩|朝)?(\d{1,2})時(?:(\d{1,2})分|(半))?/

function resolveClock(match) {
  const prefix = match[1]
  const rawHour = Number(match[2])
  const minute = match[3] ? Number(match[3]) : match[4] ? 30 : 0

  let hour
  if (AM_PREFIXES.has(prefix)) {
    hour = rawHour % 12
  } else if (PM_PREFIXES.has(prefix)) {
    hour = (rawHour % 12) + 12
  } else {
    hour = rawHour // 24時間制としてそのまま
  }
  if (hour > 23 || minute > 59) return null
  return { hour, minute }
}

export function extractTime(text, { settings }) {
  const clock = text.match(CLOCK_PATTERN)
  if (clock) {
    const resolved = resolveClock(clock)
    if (resolved) {
      return { hour: resolved.hour, minute: resolved.minute, spans: [clock[0]] }
    }
  }

  const wordRules = [
    { pattern: /正午/, hour: 12 },
    { pattern: /明け方/, hour: 5 },
    { pattern: /朝/, hour: settings.morningHour },
    { pattern: /昼過ぎ|昼/, hour: settings.noonHour },
    { pattern: /夕方|夕/, hour: settings.eveningHour },
    { pattern: /深夜/, hour: 23 },
    { pattern: /夜|晩/, hour: settings.nightHour },
  ]
  for (const rule of wordRules) {
    const match = text.match(rule.pattern)
    if (match) {
      return { hour: rule.hour, minute: 0, spans: [match[0]] }
    }
  }

  return { hour: null, minute: 0, spans: [] }
}

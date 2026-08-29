// 日時の生成・整形・曜日計算はすべてこのモジュールを経由する（date-fns ラッパー）。
// 内部表現は端末ローカルのオフセット付き ISO 8601 文字列。
import {
  format,
  parseISO,
  startOfDay,
  addDays as fnsAddDays,
  addMinutes as fnsAddMinutes,
  addMonths as fnsAddMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth as fnsIsSameMonth,
  isSameDay as fnsIsSameDay,
  getDay,
  set,
  isValid,
} from 'date-fns'
import { ja } from 'date-fns/locale'

const ISO_WITH_OFFSET = "yyyy-MM-dd'T'HH:mm:ssxxx"

export function toISO(date) {
  if (!(date instanceof Date) || !isValid(date)) return ''
  return format(date, ISO_WITH_OFFSET)
}

export function fromISO(value) {
  if (typeof value !== 'string') return new Date(NaN)
  return parseISO(value)
}

export function isValidDate(date) {
  return date instanceof Date && isValid(date)
}

export function startOfDayLocal(date) {
  return startOfDay(date)
}

export function startOfWeekLocal(date) {
  return startOfWeek(date, { weekStartsOn: 0 })
}

// 端末ローカルの 0:00 の Date を組み立てる（monthIndex は 0=1月）。
export function localDate(year, monthIndex, day) {
  return new Date(year, monthIndex, day, 0, 0, 0, 0)
}

export function addDays(date, amount) {
  return fnsAddDays(date, amount)
}

export function addMinutes(date, amount) {
  return fnsAddMinutes(date, amount)
}

// 指定日の時・分に設定し、秒・ミリ秒は 0 にする。
export function setTime(date, hour, minute) {
  return set(date, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 })
}

// 0=日曜 .. 6=土曜
export function getWeekday(date) {
  return getDay(date)
}

export function formatDayHeader(date) {
  return format(date, 'M月d日(EEE)', { locale: ja })
}

export function formatTime(date) {
  return format(date, 'HH:mm')
}

export function formatMonthTitle(date) {
  return format(date, 'yyyy年M月', { locale: ja })
}

export function formatISODate(date) {
  return format(date, 'yyyy-MM-dd')
}

// <input type="date"> / <input type="time"> の値と Date の相互変換。
export function combineDateAndTime(dateStr, timeStr) {
  return parseISO(`${dateStr}T${timeStr}:00`)
}

export function isoToDateInput(iso) {
  return format(fromISO(iso), 'yyyy-MM-dd')
}

export function isoToTimeInput(iso) {
  return format(fromISO(iso), 'HH:mm')
}

// from 以降で weekday（0..6）に最初に該当する日の 0:00。
export function nextOccurrenceOfWeekday(from, weekday, { allowToday = false } = {}) {
  const base = startOfDay(from)
  const current = getDay(base)
  let diff = (weekday - current + 7) % 7
  if (diff === 0 && !allowToday) diff = 7
  return fnsAddDays(base, diff)
}

// from 以降の直近の土曜（当日が土曜ならその日）の 0:00。
export function upcomingSaturday(from) {
  return nextOccurrenceOfWeekday(from, 6, { allowToday: true })
}

export function addMonths(date, amount) {
  return fnsAddMonths(date, amount)
}

export function isSameMonth(a, b) {
  return fnsIsSameMonth(a, b)
}

export function isSameDay(a, b) {
  return fnsIsSameDay(a, b)
}

// 月別ビューのグリッド（日曜始まり、前後の月の日を含む6週分程度）。
export function monthGridDays(monthDate) {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 })
  return eachDayOfInterval({ start, end })
}

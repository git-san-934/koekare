import { describe, it, expect } from 'vitest'
import { parseDateTime } from './dateTimeParser.js'
import { DEFAULT_SETTINGS } from '../domain/settings.js'

// 2026-08-29 は土曜日
const now = new Date('2026-08-29T09:00:00+09:00')
const opts = { now, settings: DEFAULT_SETTINGS }

describe('parseDateTime', () => {
  it('「明日の15時から会議」→ 翌日15:00開始・60分・タイトル会議', () => {
    const r = parseDateTime('明日の15時から会議', opts)
    expect(r.startAt).toBe('2026-08-30T15:00:00+09:00')
    expect(r.endAt).toBe('2026-08-30T16:00:00+09:00')
    expect(r.title).toBe('会議')
    expect(r.transcript).toBe('明日の15時から会議')
  })

  it('「来週の月曜の朝に歯医者」→ 8/31 09:00・タイトル歯医者', () => {
    const r = parseDateTime('来週の月曜の朝に歯医者', opts)
    expect(r.startAt).toBe('2026-08-31T09:00:00+09:00')
    expect(r.endAt).toBe('2026-08-31T10:00:00+09:00')
    expect(r.title).toBe('歯医者')
  })

  it('「金曜10時から11時 打ち合わせ」→ 9/4 10:00-11:00', () => {
    const r = parseDateTime('金曜10時から11時 打ち合わせ', opts)
    expect(r.startAt).toBe('2026-09-04T10:00:00+09:00')
    expect(r.endAt).toBe('2026-09-04T11:00:00+09:00')
    expect(r.title).toBe('打ち合わせ')
  })

  it('「8月30日は終日で旅行」→ 終日・タイトル旅行', () => {
    const r = parseDateTime('8月30日は終日で旅行', opts)
    expect(r.allDay).toBe(true)
    expect(r.startAt).toBe('2026-08-30T00:00:00+09:00')
    expect(r.endAt).toBe('2026-08-31T00:00:00+09:00')
    expect(r.title).toBe('旅行')
  })

  it('「1時間」の所要時間を反映する', () => {
    const r = parseDateTime('明日13時から1時間 打ち合わせ', opts)
    expect(r.startAt).toBe('2026-08-30T13:00:00+09:00')
    expect(r.endAt).toBe('2026-08-30T14:00:00+09:00')
  })

  it('時刻が取れないときは startAt を返さず dateOnly を返す', () => {
    const r = parseDateTime('明日 ジムに行く', opts)
    expect(r.startAt).toBeUndefined()
    expect(r.dateOnly).toBe('2026-08-30')
    expect(r.title).toBe('ジムに行く')
  })

  it('日付も時刻も取れないときは title のみ', () => {
    const r = parseDateTime('資料をまとめる', opts)
    expect(r.startAt).toBeUndefined()
    expect(r.dateOnly).toBeUndefined()
    expect(r.title).toBe('資料をまとめる')
  })

  it('タイトルが空になるときは title を返さない', () => {
    const r = parseDateTime('明日の15時', opts)
    expect(r.startAt).toBe('2026-08-30T15:00:00+09:00')
    expect(r.title).toBeUndefined()
  })

  it('全角・漢数字を含む入力も解釈する', () => {
    const r = parseDateTime('あすの十五時から会議', opts)
    expect(r.startAt).toBe('2026-08-30T15:00:00+09:00')
    expect(r.title).toBe('会議')
  })

  it('「9月12日から14日京都へ旅行」→ 複数日の終日予定', () => {
    const r = parseDateTime('9月12日から14日京都へ旅行', opts)
    expect(r.allDay).toBe(true)
    expect(r.startAt).toBe('2026-09-12T00:00:00+09:00')
    // endAt は最終日（14日）の翌日0:00（排他的終端）
    expect(r.endAt).toBe('2026-09-15T00:00:00+09:00')
    expect(r.title).toBe('京都へ旅行')
  })
})

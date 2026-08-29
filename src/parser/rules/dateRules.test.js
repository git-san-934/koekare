import { describe, it, expect } from 'vitest'
import { extractDate, extractDateRange } from './dateRules.js'
import { formatISODate } from '../../datetime.js'

// 2026-08-29 は土曜日
const now = new Date('2026-08-29T09:00:00+09:00')

function dateOf(text) {
  const { date } = extractDate(text, { now })
  return date ? formatISODate(date) : null
}

describe('extractDate', () => {
  it('相対語', () => {
    expect(dateOf('今日')).toBe('2026-08-29')
    expect(dateOf('本日')).toBe('2026-08-29')
    expect(dateOf('明日')).toBe('2026-08-30')
    expect(dateOf('あさって')).toBe('2026-08-31')
    expect(dateOf('明後日')).toBe('2026-08-31')
    expect(dateOf('明々後日')).toBe('2026-09-01')
  })

  it('曜日のみは実行日より後の直近', () => {
    expect(dateOf('金曜')).toBe('2026-09-04')
    expect(dateOf('月曜日')).toBe('2026-08-31')
  })

  it('今週の◯曜（過ぎていれば次の該当曜日）', () => {
    // 木曜は 8-27 で過去 → 次の木曜 9-03
    expect(dateOf('今週の木曜')).toBe('2026-09-03')
  })

  it('来週の◯曜', () => {
    expect(dateOf('来週の金曜')).toBe('2026-09-04')
  })

  it('今週末は直近の土曜', () => {
    expect(dateOf('週末')).toBe('2026-08-29')
  })

  it('◯月◯日（過去日付は翌年）', () => {
    expect(dateOf('8月30日')).toBe('2026-08-30')
    expect(dateOf('1月5日')).toBe('2027-01-05')
  })

  it('◯日のみ（当月で過ぎていれば翌月）', () => {
    expect(dateOf('30日')).toBe('2026-08-30')
    expect(dateOf('3日')).toBe('2026-09-03')
  })

  it('日付表現がなければ null', () => {
    expect(dateOf('会議')).toBe(null)
  })

  it('マッチした部分文字列を spans で返す', () => {
    expect(extractDate('明日の会議', { now }).spans).toEqual(['明日'])
  })
})

describe('extractDateRange', () => {
  function range(text) {
    const r = extractDateRange(text, { now })
    return r ? [formatISODate(r.start), formatISODate(r.end)] : null
  }

  it('◯月◯日から◯日（同月）', () => {
    expect(range('9月12日から14日')).toEqual(['2026-09-12', '2026-09-14'])
  })

  it('◯月◯日から◯月◯日', () => {
    expect(range('9月30日から10月2日まで')).toEqual(['2026-09-30', '2026-10-02'])
  })

  it('◯日から◯日（当月）', () => {
    expect(range('30日から31日')).toEqual(['2026-08-30', '2026-08-31'])
  })

  it('〜 区切りも解釈する', () => {
    expect(range('9月12日〜9月14日')).toEqual(['2026-09-12', '2026-09-14'])
  })

  it('範囲でなければ null', () => {
    expect(range('9月12日 会議')).toBe(null)
  })
})

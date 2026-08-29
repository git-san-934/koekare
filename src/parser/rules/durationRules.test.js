import { describe, it, expect } from 'vitest'
import { extractDuration } from './durationRules.js'

describe('extractDuration', () => {
  it('◯時から△時 の範囲', () => {
    const r = extractDuration('10時から11時')
    expect(r.endHour).toBe(11)
    expect(r.endMinute).toBe(0)
    expect(r.spans).toEqual(['から11時'])
  })

  it('◯時から△時半', () => {
    const r = extractDuration('10時から11時半まで')
    expect(r.endHour).toBe(11)
    expect(r.endMinute).toBe(30)
  })

  it('◯時間 / ◯時間半', () => {
    expect(extractDuration('1時間').durationMinutes).toBe(60)
    expect(extractDuration('2時間半').durationMinutes).toBe(150)
  })

  it('◯分間', () => {
    expect(extractDuration('30分間').durationMinutes).toBe(30)
  })

  it('終日', () => {
    expect(extractDuration('終日').allDay).toBe(true)
    expect(extractDuration('一日中').allDay).toBe(true)
  })

  it('該当なし', () => {
    const r = extractDuration('会議')
    expect(r.allDay).toBeUndefined()
    expect(r.endHour).toBeUndefined()
    expect(r.durationMinutes).toBeUndefined()
  })
})

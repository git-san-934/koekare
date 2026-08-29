import { describe, it, expect } from 'vitest'
import { extractTime } from './timeRules.js'
import { DEFAULT_SETTINGS } from '../../domain/settings.js'

const settings = DEFAULT_SETTINGS

function time(text) {
  const { hour, minute } = extractTime(text, { settings })
  return hour === null ? null : `${hour}:${String(minute).padStart(2, '0')}`
}

describe('extractTime', () => {
  it('◯時 は24時間制でそのまま', () => {
    expect(time('15時')).toBe('15:00')
    expect(time('9時')).toBe('9:00')
    expect(time('23時')).toBe('23:00')
  })

  it('◯時◯分 / ◯時半', () => {
    expect(time('15時30分')).toBe('15:30')
    expect(time('15時半')).toBe('15:30')
  })

  it('午前・午後', () => {
    expect(time('午後3時')).toBe('15:00')
    expect(time('午前9時')).toBe('9:00')
    expect(time('午前12時')).toBe('0:00')
    expect(time('午後12時')).toBe('12:00')
  })

  it('夜◯時・朝◯時', () => {
    expect(time('夜8時')).toBe('20:00')
    expect(time('朝10時')).toBe('10:00')
  })

  it('時間帯の語は settings の時刻', () => {
    expect(time('朝')).toBe('9:00')
    expect(time('昼')).toBe('12:00')
    expect(time('夕方')).toBe('17:00')
    expect(time('夜')).toBe('19:00')
    expect(time('正午')).toBe('12:00')
  })

  it('時刻表現がなければ null', () => {
    expect(time('会議')).toBe(null)
  })

  it('spans を返す', () => {
    expect(extractTime('15時から', { settings }).spans).toEqual(['15時'])
  })
})

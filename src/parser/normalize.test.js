import { describe, it, expect } from 'vitest'
import { normalize } from './normalize.js'

describe('normalize', () => {
  it('全角数字を半角にする', () => {
    expect(normalize('１５時')).toBe('15時')
  })

  it('連続する空白を1つに圧縮し前後を削る', () => {
    expect(normalize('  明日   の  会議 ')).toBe('明日 の 会議')
  })

  it('漢数字を算用数字にする（一桁）', () => {
    expect(normalize('三時半')).toBe('3時半')
  })

  it('漢数字を算用数字にする（十の位）', () => {
    expect(normalize('十五時')).toBe('15時')
    expect(normalize('二十三日')).toBe('23日')
    expect(normalize('十時')).toBe('10時')
  })

  it('文字列以外は空文字を返す', () => {
    expect(normalize(null)).toBe('')
    expect(normalize(undefined)).toBe('')
  })
})

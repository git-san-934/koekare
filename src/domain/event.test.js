import { describe, it, expect } from 'vitest'
import { createEvent, applyChanges, validateEvent } from './event.js'
import { DEFAULT_SETTINGS } from './settings.js'

const now = new Date('2026-08-29T09:00:00+09:00')

describe('validateEvent', () => {
  it('タイトルが空なら「タイトルを入力してください」を返す', () => {
    const errors = validateEvent({
      title: '   ',
      startAt: '2026-08-30T15:00:00+09:00',
      endAt: '2026-08-30T16:00:00+09:00',
    })
    expect(errors).toContain('タイトルを入力してください')
  })

  it('終了が開始より前なら「終了は開始より後にしてください」を返す', () => {
    const errors = validateEvent({
      title: '会議',
      startAt: '2026-08-30T16:00:00+09:00',
      endAt: '2026-08-30T15:00:00+09:00',
    })
    expect(errors).toContain('終了は開始より後にしてください')
  })

  it('不正な日時文字列を検出する', () => {
    const errors = validateEvent({ title: '会議', startAt: 'あした', endAt: 'なし' })
    expect(errors).toContain('開始日時が正しくありません')
    expect(errors).toContain('終了日時が正しくありません')
  })

  it('妥当な予定なら空配列を返す', () => {
    const errors = validateEvent({
      title: '会議',
      startAt: '2026-08-30T15:00:00+09:00',
      endAt: '2026-08-30T16:00:00+09:00',
    })
    expect(errors).toEqual([])
  })
})

describe('createEvent', () => {
  it('終了時刻が未指定なら既定の予定長さ（60分）で補完する', () => {
    const event = createEvent(
      { title: '会議', startAt: '2026-08-30T15:00:00+09:00' },
      { settings: DEFAULT_SETTINGS, now },
    )
    expect(event.endAt).toBe('2026-08-30T16:00:00+09:00')
  })

  it('settings の defaultDurationMinutes を反映する', () => {
    const event = createEvent(
      { title: '通院', startAt: '2026-08-30T09:00:00+09:00' },
      { settings: { ...DEFAULT_SETTINGS, defaultDurationMinutes: 30 }, now },
    )
    expect(event.endAt).toBe('2026-08-30T09:30:00+09:00')
  })

  it('終日予定は startAt=その日0:00、endAt=翌日0:00 に正規化する', () => {
    const event = createEvent(
      { title: '旅行', startAt: '2026-08-30T15:00:00+09:00', allDay: true },
      { settings: DEFAULT_SETTINGS, now },
    )
    expect(event.allDay).toBe(true)
    expect(event.startAt).toBe('2026-08-30T00:00:00+09:00')
    expect(event.endAt).toBe('2026-08-31T00:00:00+09:00')
  })

  it('id を採番し、createdAt と updatedAt に now を入れる', () => {
    const event = createEvent(
      { title: '会議', startAt: '2026-08-30T15:00:00+09:00' },
      { settings: DEFAULT_SETTINGS, now },
    )
    expect(event.id).toMatch(/[0-9a-f-]{36}/)
    expect(event.createdAt).toBe('2026-08-29T09:00:00+09:00')
    expect(event.updatedAt).toBe('2026-08-29T09:00:00+09:00')
    expect(event.source).toBe('manual')
  })

  it('source=voice を保持する', () => {
    const event = createEvent(
      { title: '会議', startAt: '2026-08-30T15:00:00+09:00', source: 'voice' },
      { settings: DEFAULT_SETTINGS, now },
    )
    expect(event.source).toBe('voice')
  })

  it('タイトルが空なら ValidationError を投げる', () => {
    expect(() =>
      createEvent(
        { title: '', startAt: '2026-08-30T15:00:00+09:00' },
        { settings: DEFAULT_SETTINGS, now },
      ),
    ).toThrow('タイトルを入力してください')
  })
})

describe('applyChanges', () => {
  const base = createEvent(
    { title: '会議', startAt: '2026-08-30T15:00:00+09:00', source: 'voice' },
    { settings: DEFAULT_SETTINGS, now },
  )

  it('変更をマージし updatedAt を更新する', () => {
    const later = new Date('2026-08-29T10:00:00+09:00')
    const updated = applyChanges(base, { title: '打ち合わせ' }, { now: later })
    expect(updated.title).toBe('打ち合わせ')
    expect(updated.updatedAt).toBe('2026-08-29T10:00:00+09:00')
  })

  it('id・source・createdAt は変更できない', () => {
    const updated = applyChanges(
      base,
      { id: 'x', source: 'manual', createdAt: '2000-01-01T00:00:00+09:00' },
      { now },
    )
    expect(updated.id).toBe(base.id)
    expect(updated.source).toBe('voice')
    expect(updated.createdAt).toBe(base.createdAt)
  })

  it('allDay に変更すると日境界へ正規化する', () => {
    const updated = applyChanges(base, { allDay: true }, { now })
    expect(updated.startAt).toBe('2026-08-30T00:00:00+09:00')
    expect(updated.endAt).toBe('2026-08-31T00:00:00+09:00')
  })

  it('終了が開始より前になる変更は ValidationError を投げる', () => {
    expect(() =>
      applyChanges(base, { endAt: '2026-08-30T14:00:00+09:00' }, { now }),
    ).toThrow('終了は開始より後にしてください')
  })
})

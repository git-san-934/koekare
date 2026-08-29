import { describe, it, expect } from 'vitest'
import { buildBackup, parseBackup, importEvents, BackupError, SCHEMA_VERSION } from './backup.js'
import * as eventStore from './eventStore.js'

const now = new Date('2026-08-29T09:00:00+09:00')

function sampleEvent(overrides = {}) {
  return {
    id: 'evt-1',
    title: '会議',
    startAt: '2026-08-30T15:00:00+09:00',
    endAt: '2026-08-30T16:00:00+09:00',
    allDay: false,
    source: 'manual',
    createdAt: '2026-08-29T09:00:00+09:00',
    updatedAt: '2026-08-29T09:00:00+09:00',
    ...overrides,
  }
}

describe('buildBackup / parseBackup', () => {
  it('往復して同じ予定に戻る', () => {
    const events = [sampleEvent({ id: 'b', startAt: '2026-08-31T10:00:00+09:00', endAt: '2026-08-31T11:00:00+09:00' }), sampleEvent({ id: 'a' })]
    const json = JSON.stringify(buildBackup(events))
    const parsed = parseBackup(json)
    expect(parsed.map((e) => e.id)).toEqual(['a', 'b']) // startAt 昇順
    expect(parsed[0]).toMatchObject(sampleEvent({ id: 'a' }))
  })

  it('app が違うと BackupError', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'other', schemaVersion: 1, events: [] }))).toThrow(BackupError)
  })

  it('schemaVersion が違うと BackupError', () => {
    expect(() =>
      parseBackup(JSON.stringify({ app: 'koekare', schemaVersion: SCHEMA_VERSION + 1, events: [] })),
    ).toThrow('対応していない形式')
  })

  it('events が配列でないと BackupError', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'koekare', schemaVersion: 1, events: {} }))).toThrow(BackupError)
  })

  it('JSONとして不正だと BackupError', () => {
    expect(() => parseBackup('{壊れて')).toThrow(BackupError)
  })

  it('必須項目が欠けていると BackupError', () => {
    const bad = { app: 'koekare', schemaVersion: 1, events: [{ id: 'x', startAt: '2026-08-30T15:00:00+09:00', endAt: '2026-08-30T16:00:00+09:00' }] }
    expect(() => parseBackup(JSON.stringify(bad))).toThrow('「title」がありません')
  })

  it('終了が開始より前だと BackupError', () => {
    const bad = { app: 'koekare', schemaVersion: 1, events: [sampleEvent({ endAt: '2026-08-30T14:00:00+09:00' })] }
    expect(() => parseBackup(JSON.stringify(bad))).toThrow('終了が開始より前')
  })
})

describe('importEvents', () => {
  it('同一 id を上書きする（merge）', async () => {
    await eventStore.add({ title: '古い', startAt: '2026-08-30T15:00:00+09:00' }, { now })
    const existing = (await eventStore.list())[0]
    const backup = JSON.stringify(buildBackup([sampleEvent({ id: existing.id, title: '新しい' })]))
    const { imported } = await importEvents(backup)
    expect(imported).toBe(1)
    expect((await eventStore.get(existing.id)).title).toBe('新しい')
  })

  it('検証に失敗した場合は既存データを変更しない', async () => {
    const saved = await eventStore.add({ title: '大事な予定', startAt: '2026-08-30T15:00:00+09:00' }, { now })
    await expect(importEvents('こわれたファイル')).rejects.toThrow(BackupError)
    await expect(importEvents(JSON.stringify({ app: 'koekare', schemaVersion: 1, events: [{ id: 'z' }] }))).rejects.toThrow(BackupError)
    expect((await eventStore.get(saved.id)).title).toBe('大事な予定')
    expect(await eventStore.list()).toHaveLength(1)
  })
})

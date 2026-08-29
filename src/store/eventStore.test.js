import { describe, it, expect } from 'vitest'
import * as eventStore from './eventStore.js'

const now = new Date('2026-08-29T09:00:00+09:00')

function input(overrides = {}) {
  return {
    title: '会議',
    startAt: '2026-08-30T15:00:00+09:00',
    ...overrides,
  }
}

describe('eventStore', () => {
  it('add で予定を保存し get で取得できる', async () => {
    const saved = await eventStore.add(input(), { now })
    const loaded = await eventStore.get(saved.id)
    expect(loaded.title).toBe('会議')
    expect(loaded.endAt).toBe('2026-08-30T16:00:00+09:00')
  })

  it('update で内容を変更し updatedAt が進む', async () => {
    const saved = await eventStore.add(input(), { now })
    const later = new Date('2026-08-29T12:00:00+09:00')
    const updated = await eventStore.update(saved.id, { title: '打ち合わせ' }, { now: later })
    expect(updated.title).toBe('打ち合わせ')
    expect(updated.updatedAt).toBe('2026-08-29T12:00:00+09:00')
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(new Date(saved.updatedAt).getTime())
  })

  it('存在しない id の update はエラー', async () => {
    await expect(eventStore.update('missing', { title: 'x' })).rejects.toThrow('予定が見つかりません')
  })

  it('remove で予定を削除できる', async () => {
    const saved = await eventStore.add(input(), { now })
    await eventStore.remove(saved.id)
    expect(await eventStore.get(saved.id)).toBeUndefined()
  })

  it('list は範囲 [from, to) の予定だけを返す', async () => {
    await eventStore.add(input({ title: '29日', startAt: '2026-08-29T10:00:00+09:00' }), { now })
    await eventStore.add(input({ title: '30日朝', startAt: '2026-08-30T09:00:00+09:00' }), { now })
    await eventStore.add(input({ title: '30日夜', startAt: '2026-08-30T21:00:00+09:00' }), { now })
    await eventStore.add(input({ title: '31日', startAt: '2026-08-31T09:00:00+09:00' }), { now })

    const from = new Date('2026-08-30T00:00:00+09:00')
    const to = new Date('2026-08-31T00:00:00+09:00')
    const list = await eventStore.list({ from, to })
    expect(list.map((e) => e.title).sort()).toEqual(['30日夜', '30日朝'].sort())
  })

  it('list は範囲なしなら全件を startAt 昇順で返す', async () => {
    await eventStore.add(input({ title: 'B', startAt: '2026-08-30T15:00:00+09:00' }), { now })
    await eventStore.add(input({ title: 'A', startAt: '2026-08-29T15:00:00+09:00' }), { now })
    const list = await eventStore.list()
    expect(list.map((e) => e.title)).toEqual(['A', 'B'])
  })

  it('bulkPut は複数件を一括保存する', async () => {
    await eventStore.bulkPut([
      { id: '1', title: 'a', startAt: '2026-08-30T10:00:00+09:00', endAt: '2026-08-30T11:00:00+09:00', allDay: false, source: 'manual', createdAt: '2026-08-29T09:00:00+09:00', updatedAt: '2026-08-29T09:00:00+09:00' },
      { id: '2', title: 'b', startAt: '2026-08-30T12:00:00+09:00', endAt: '2026-08-30T13:00:00+09:00', allDay: false, source: 'manual', createdAt: '2026-08-29T09:00:00+09:00', updatedAt: '2026-08-29T09:00:00+09:00' },
    ])
    const list = await eventStore.list()
    expect(list).toHaveLength(2)
  })
})

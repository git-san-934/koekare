// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AllEventsView } from './AllEventsView.jsx'
import * as eventStore from '../store/eventStore.js'

const now = new Date('2026-08-29T09:00:00+09:00')

async function seed() {
  await eventStore.add({ title: '歯医者', startAt: '2026-08-29T09:00:00+09:00' }, { now })
  await eventStore.add({ title: '打ち合わせ', startAt: '2026-08-29T15:00:00+09:00' }, { now })
  await eventStore.add({ title: '旅行', startAt: '2026-08-30T00:00:00+09:00', allDay: true }, { now })
}

describe('AllEventsView', () => {
  it('すべての予定を日付ごとに箇条書きで表示する', async () => {
    await seed()
    render(<AllEventsView onClose={vi.fn()} onEditEvent={vi.fn()} />)

    expect(await screen.findByText('全3件')).toBeInTheDocument()
    expect(screen.getByText('2026年8月29日(土)')).toBeInTheDocument()
    expect(screen.getByText('2026年8月30日(日)')).toBeInTheDocument()
    expect(screen.getByText('09:00–10:00')).toBeInTheDocument()
    expect(screen.getByText('歯医者')).toBeInTheDocument()
    expect(screen.getByText('終日')).toBeInTheDocument()
    expect(screen.getByText('旅行')).toBeInTheDocument()
    // 箇条書き（リスト項目）
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('複数日の終日予定は期間中の各日に表示される', async () => {
    await eventStore.add(
      {
        title: '京都旅行',
        startAt: '2026-09-11T00:00:00+09:00',
        endAt: '2026-09-14T00:00:00+09:00',
        allDay: true,
      },
      { now },
    )
    render(<AllEventsView onClose={vi.fn()} onEditEvent={vi.fn()} />)

    expect(await screen.findByText('全1件')).toBeInTheDocument()
    expect(screen.getByText('2026年9月11日(金)')).toBeInTheDocument()
    expect(screen.getByText('2026年9月12日(土)')).toBeInTheDocument()
    expect(screen.getByText('2026年9月13日(日)')).toBeInTheDocument()
    expect(screen.queryByText('2026年9月14日(月)')).not.toBeInTheDocument()
    // 同じ予定が3日ぶん（3項目）表示される
    expect(screen.getAllByText('京都旅行')).toHaveLength(3)
    expect(screen.getAllByText('9/11〜9/13')).toHaveLength(3)
  })

  it('予定がなければ「予定はありません」', async () => {
    render(<AllEventsView onClose={vi.fn()} onEditEvent={vi.fn()} />)
    expect(await screen.findByText('予定はありません')).toBeInTheDocument()
  })

  it('項目をタップすると onEditEvent が呼ばれる', async () => {
    await seed()
    const onEditEvent = vi.fn()
    render(<AllEventsView onClose={vi.fn()} onEditEvent={onEditEvent} />)
    await screen.findByText('打ち合わせ')
    await userEvent.click(screen.getByText('打ち合わせ'))
    await waitFor(() =>
      expect(onEditEvent).toHaveBeenCalledWith(expect.objectContaining({ title: '打ち合わせ' })),
    )
  })

  it('閉じるボタンで onClose を呼ぶ', async () => {
    const onClose = vi.fn()
    render(<AllEventsView onClose={onClose} onEditEvent={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: '閉じる' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('赤い丸ボタン（日別表示に戻る）で onClose を呼ぶ', async () => {
    const onClose = vi.fn()
    render(<AllEventsView onClose={onClose} onEditEvent={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: '日別表示に戻る' }))
    expect(onClose).toHaveBeenCalled()
  })
})

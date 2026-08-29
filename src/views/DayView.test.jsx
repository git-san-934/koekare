// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DayView } from './DayView.jsx'

const baseProps = {
  date: new Date('2026-08-29T00:00:00+09:00'),
  events: [],
  loading: false,
  onPrevDay: vi.fn(),
  onNextDay: vi.fn(),
  onToday: vi.fn(),
  onOpenMonth: vi.fn(),
  onOpenMenu: vi.fn(),
  onShowAll: vi.fn(),
  onExport: vi.fn(),
  onNewEvent: vi.fn(),
  onEditEvent: vi.fn(),
  onStartVoice: vi.fn(),
  voiceSupported: true,
}

describe('DayView', () => {
  it('渡された予定を開始〜終了の時刻つきでリスト表示する', () => {
    render(
      <DayView
        {...baseProps}
        events={[
          {
            id: '1',
            title: '歯医者',
            startAt: '2026-08-29T09:00:00+09:00',
            endAt: '2026-08-29T10:00:00+09:00',
            allDay: false,
          },
          {
            id: '2',
            title: '打ち合わせ',
            startAt: '2026-08-29T15:00:00+09:00',
            endAt: '2026-08-29T16:00:00+09:00',
            allDay: false,
          },
        ]}
      />,
    )
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('歯医者')).toBeInTheDocument()
    expect(screen.getByText('09:00–10:00')).toBeInTheDocument()
    expect(screen.getByText('打ち合わせ')).toBeInTheDocument()
  })

  it('予定がなければ「予定なし」を表示する', () => {
    render(<DayView {...baseProps} events={[]} />)
    expect(screen.getByText('予定なし')).toBeInTheDocument()
  })

  it('終日予定は「終日」と表示する', () => {
    render(
      <DayView
        {...baseProps}
        events={[{ id: '3', title: '旅行', startAt: '2026-08-29T00:00:00+09:00', allDay: true }]}
      />,
    )
    expect(screen.getByText('終日')).toBeInTheDocument()
  })

  it('予定をタップすると onEditEvent が呼ばれる', async () => {
    const onEditEvent = vi.fn()
    render(
      <DayView
        {...baseProps}
        onEditEvent={onEditEvent}
        events={[{ id: '1', title: '歯医者', startAt: '2026-08-29T09:00:00+09:00', allDay: false }]}
      />,
    )
    await userEvent.click(screen.getByText('歯医者'))
    expect(onEditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', title: '歯医者' }),
    )
  })

  it('音声非対応ならマイクボタンが無効', () => {
    render(<DayView {...baseProps} voiceSupported={false} />)
    expect(
      screen.getByRole('button', { name: /音声入力は利用できません/ }),
    ).toBeDisabled()
  })

  it('一覧ボタンで onShowAll が呼ばれる', async () => {
    const onShowAll = vi.fn()
    render(<DayView {...baseProps} onShowAll={onShowAll} />)
    await userEvent.click(screen.getByRole('button', { name: 'すべての予定を一覧で見る' }))
    expect(onShowAll).toHaveBeenCalled()
  })

  it('書き出しボタンで onExport が呼ばれる', async () => {
    const onExport = vi.fn()
    render(<DayView {...baseProps} onExport={onExport} />)
    await userEvent.click(screen.getByRole('button', { name: 'すべての予定をファイルに書き出す' }))
    expect(onExport).toHaveBeenCalled()
  })

  function swipe(el, dx, dy = 0) {
    fireEvent.touchStart(el, { touches: [{ clientX: 200, clientY: 300 }] })
    fireEvent.touchEnd(el, { changedTouches: [{ clientX: 200 + dx, clientY: 300 + dy }] })
  }

  it('左スワイプで onNextDay、右スワイプで onPrevDay を呼ぶ', () => {
    const onNextDay = vi.fn()
    const onPrevDay = vi.fn()
    const { container } = render(
      <DayView {...baseProps} onNextDay={onNextDay} onPrevDay={onPrevDay} />,
    )
    const view = container.querySelector('.day-view')

    swipe(view, -120)
    expect(onNextDay).toHaveBeenCalledTimes(1)

    swipe(view, 120)
    expect(onPrevDay).toHaveBeenCalledTimes(1)
  })

  it('小さな動きや縦方向の動きでは日付を変えない', () => {
    const onNextDay = vi.fn()
    const onPrevDay = vi.fn()
    const { container } = render(
      <DayView {...baseProps} onNextDay={onNextDay} onPrevDay={onPrevDay} />,
    )
    const view = container.querySelector('.day-view')

    swipe(view, -20) // 距離不足
    swipe(view, -100, 200) // 縦移動が大きい（スクロール）
    expect(onNextDay).not.toHaveBeenCalled()
    expect(onPrevDay).not.toHaveBeenCalled()
  })
})

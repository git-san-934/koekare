// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventForm } from './EventForm.jsx'
import * as eventStore from '../store/eventStore.js'

const selectedDate = new Date('2026-08-29T00:00:00+09:00')

function noop() {}

// jsdom の date/time 入力は userEvent.type と相性が悪いため change イベントで設定する。
function setField(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

async function clickSave() {
  await userEvent.click(screen.getByRole('button', { name: '保存' }))
}

describe('EventForm（新規）', () => {
  it('タイトル未入力で保存するとエラーを表示し onSaved を呼ばない', async () => {
    const onSaved = vi.fn()
    render(
      <EventForm initial={{}} selectedDate={selectedDate} onSaved={onSaved} onDeleted={noop} onCancel={noop} />,
    )
    await clickSave()
    expect(await screen.findByText('タイトルを入力してください')).toBeInTheDocument()
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('開始時刻未入力（終日でない）で保存するとエラー', async () => {
    render(
      <EventForm initial={{}} selectedDate={selectedDate} onSaved={vi.fn()} onDeleted={noop} onCancel={noop} />,
    )
    setField('タイトル', '会議')
    await clickSave()
    expect(await screen.findByText('開始時刻を入力してください')).toBeInTheDocument()
  })

  it('タイトル・日付・開始時刻を入力して保存すると予定が作られる', async () => {
    const onSaved = vi.fn()
    render(
      <EventForm initial={{}} selectedDate={selectedDate} onSaved={onSaved} onDeleted={noop} onCancel={noop} />,
    )
    setField('タイトル', '打ち合わせ')
    setField('開始', '15:00')
    await clickSave()

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    const saved = onSaved.mock.calls[0][0]
    expect(saved.title).toBe('打ち合わせ')
    expect(saved.startAt).toBe('2026-08-29T15:00:00+09:00')
    expect(saved.endAt).toBe('2026-08-29T16:00:00+09:00')
    expect(await eventStore.get(saved.id)).toBeTruthy()
  })

  it('終日にチェックすると時刻なしで保存できる', async () => {
    const onSaved = vi.fn()
    render(
      <EventForm initial={{}} selectedDate={selectedDate} onSaved={onSaved} onDeleted={noop} onCancel={noop} />,
    )
    setField('タイトル', '旅行')
    await userEvent.click(screen.getByLabelText('終日'))
    await clickSave()
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    const saved = onSaved.mock.calls[0][0]
    expect(saved.allDay).toBe(true)
    expect(saved.startAt).toBe('2026-08-29T00:00:00+09:00')
  })

  it('終日で開始日・終了日を指定すると複数日の予定になる', async () => {
    const onSaved = vi.fn()
    render(
      <EventForm initial={{}} selectedDate={selectedDate} onSaved={onSaved} onDeleted={noop} onCancel={noop} />,
    )
    setField('タイトル', '京都旅行')
    await userEvent.click(screen.getByLabelText('終日'))
    setField('開始日', '2026-09-12')
    setField('終了日', '2026-09-14')
    await clickSave()
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    const saved = onSaved.mock.calls[0][0]
    expect(saved.startAt).toBe('2026-09-12T00:00:00+09:00')
    expect(saved.endAt).toBe('2026-09-15T00:00:00+09:00')
  })

  it('終了日が開始日より前だとエラー', async () => {
    render(
      <EventForm initial={{}} selectedDate={selectedDate} onSaved={vi.fn()} onDeleted={noop} onCancel={noop} />,
    )
    setField('タイトル', '旅行')
    await userEvent.click(screen.getByLabelText('終日'))
    setField('開始日', '2026-09-14')
    setField('終了日', '2026-09-12')
    await clickSave()
    expect(await screen.findByText('終了日は開始日以降にしてください')).toBeInTheDocument()
  })

  it('音声からの下書き（transcript あり）は聞き取り内容を表示し source=voice で保存する', async () => {
    const onSaved = vi.fn()
    render(
      <EventForm
        initial={{ transcript: '明日の15時から会議', title: '会議', source: 'voice' }}
        selectedDate={selectedDate}
        onSaved={onSaved}
        onDeleted={noop}
        onCancel={noop}
      />,
    )
    expect(screen.getByText(/聞き取った内容/)).toBeInTheDocument()
    setField('開始', '15:00')
    await clickSave()
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    expect(onSaved.mock.calls[0][0].source).toBe('voice')
  })
})

describe('EventForm（編集）', () => {
  function seedEvent() {
    return eventStore.add(
      { title: '歯医者', startAt: '2026-08-29T09:00:00+09:00' },
      { now: new Date('2026-08-20T00:00:00+09:00') },
    )
  }

  it('既存値が初期表示され、変更を保存できる', async () => {
    const event = await seedEvent()
    const onSaved = vi.fn()
    render(
      <EventForm initial={event} selectedDate={selectedDate} onSaved={onSaved} onDeleted={noop} onCancel={noop} />,
    )
    expect(screen.getByLabelText('タイトル')).toHaveValue('歯医者')
    setField('タイトル', '歯科検診')
    await clickSave()
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    expect(onSaved.mock.calls[0][0].title).toBe('歯科検診')
  })

  it('削除は確認ステップを経て onDeleted を呼ぶ', async () => {
    const event = await seedEvent()
    const onDeleted = vi.fn()
    render(
      <EventForm initial={event} selectedDate={selectedDate} onSaved={noop} onDeleted={onDeleted} onCancel={noop} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'この予定を削除' }))
    expect(screen.getByText('この予定を削除しますか？')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '削除する' }))
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(event.id))
    expect(await eventStore.get(event.id)).toBeUndefined()
  })

  it('終了を開始より前にするとエラー', async () => {
    const event = await seedEvent()
    render(
      <EventForm initial={event} selectedDate={selectedDate} onSaved={vi.fn()} onDeleted={noop} onCancel={noop} />,
    )
    setField('終了', '08:00')
    await clickSave()
    expect(await screen.findByText('終了は開始より後にしてください')).toBeInTheDocument()
  })
})

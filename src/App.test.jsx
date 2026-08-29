// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'
import * as eventStore from './store/eventStore.js'

async function seed(title) {
  return eventStore.add({ title, startAt: '2026-09-12T10:00:00+09:00' })
}

describe('App - フォームを閉じたときの戻り先', () => {
  it('すべての予定から予定を削除すると、すべての予定に戻る', async () => {
    await seed('会議')
    render(<App />)

    await userEvent.click(await screen.findByRole('button', { name: 'すべての予定を一覧で見る' }))
    await userEvent.click(await screen.findByText('会議'))
    await userEvent.click(await screen.findByRole('button', { name: 'この予定を削除' }))
    await userEvent.click(screen.getByRole('button', { name: '削除する' }))

    // すべての予定の画面に戻り、削除済み
    expect(await screen.findByRole('heading', { name: 'すべての予定' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('会議')).not.toBeInTheDocument())
  })

  it('すべての予定から予定を編集すると、すべての予定に戻る', async () => {
    await seed('会議')
    render(<App />)

    await userEvent.click(await screen.findByRole('button', { name: 'すべての予定を一覧で見る' }))
    await userEvent.click(await screen.findByText('会議'))

    const title = await screen.findByLabelText('タイトル')
    await userEvent.clear(title)
    await userEvent.type(title, '打ち合わせ')
    await userEvent.click(screen.getByRole('button', { name: '保存' }))

    expect(await screen.findByRole('heading', { name: 'すべての予定' })).toBeInTheDocument()
    expect(await screen.findByText('打ち合わせ')).toBeInTheDocument()
  })
})

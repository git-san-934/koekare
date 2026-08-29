// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VoiceOverlay } from './VoiceOverlay.jsx'

// script(api) は start() 内で呼ばれ、テストごとの認識シナリオを再現する。
function fakeRecognizerFactory(script) {
  return () => {
    const api = { supported: true, onResult: null, onError: null, onEnd: null, stop: vi.fn() }
    api.start = () => {
      setTimeout(() => script(api), 0)
    }
    return api
  }
}

describe('VoiceOverlay', () => {
  it('認識成功で推測結果を onParsed に渡す', async () => {
    const onParsed = vi.fn()
    render(
      <VoiceOverlay
        onParsed={onParsed}
        onCancel={vi.fn()}
        settings={undefined}
        recognizerFactory={fakeRecognizerFactory((api) => {
          api.onResult('明日の15時から会議', { isFinal: true })
        })}
      />,
    )
    await waitFor(() => expect(onParsed).toHaveBeenCalledTimes(1))
    const parsed = onParsed.mock.calls[0][0]
    expect(parsed.title).toBe('会議')
    expect(parsed.startAt).toContain('T15:00:00')
  })

  it('オフラインエラー時はメッセージと「手入力する」を表示し、押すと onParsed を呼ぶ', async () => {
    const onParsed = vi.fn()
    render(
      <VoiceOverlay
        onParsed={onParsed}
        onCancel={vi.fn()}
        recognizerFactory={fakeRecognizerFactory((api) => {
          api.onError('offline')
        })}
      />,
    )
    expect(await screen.findByText(/ネット接続が必要/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '手入力する' }))
    expect(onParsed).toHaveBeenCalledTimes(1)
    expect(onParsed.mock.calls[0][0]).toEqual({ transcript: '' })
  })

  it('途中経過（isFinal=false）は表示するが確定しない', async () => {
    const onParsed = vi.fn()
    render(
      <VoiceOverlay
        onParsed={onParsed}
        onCancel={vi.fn()}
        recognizerFactory={fakeRecognizerFactory((api) => {
          api.onResult('あした', { isFinal: false })
        })}
      />,
    )
    expect(await screen.findByText('あした')).toBeInTheDocument()
    expect(onParsed).not.toHaveBeenCalled()
  })

  it('キャンセルで onCancel を呼ぶ', async () => {
    const onCancel = vi.fn()
    render(
      <VoiceOverlay
        onParsed={vi.fn()}
        onCancel={onCancel}
        recognizerFactory={fakeRecognizerFactory(() => {})}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(onCancel).toHaveBeenCalled()
  })
})

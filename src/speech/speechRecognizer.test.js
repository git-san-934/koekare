// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSpeechRecognizer } from './speechRecognizer.js'

let instances = []

class FakeRecognition {
  constructor() {
    instances.push(this)
    this.start = vi.fn()
    this.stop = vi.fn()
  }
}

function resultEvent(...transcripts) {
  return { results: transcripts.map((t) => [{ transcript: t }]) }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  instances = []
  if (Object.getOwnPropertyDescriptor(navigator, 'onLine')?.configurable) {
    delete navigator.onLine
  }
})

describe('createSpeechRecognizer', () => {
  it('start で ja-JP・continuous の認識を開始する', () => {
    const recognizer = createSpeechRecognizer({ RecognitionCtor: FakeRecognition })
    recognizer.start()
    expect(instances).toHaveLength(1)
    expect(instances[0].lang).toBe('ja-JP')
    expect(instances[0].interimResults).toBe(true)
    expect(instances[0].continuous).toBe(true)
    expect(instances[0].start).toHaveBeenCalled()
  })

  it('認識中は暫定結果（isFinal:false）を渡す', () => {
    const recognizer = createSpeechRecognizer({ RecognitionCtor: FakeRecognition })
    const onResult = vi.fn()
    recognizer.onResult = onResult
    recognizer.start()
    instances[0].onresult(resultEvent('明日の'))
    expect(onResult).toHaveBeenLastCalledWith('明日の', { isFinal: false })
  })

  it('発話が1秒途切れたら確定（isFinal:true）して停止する', () => {
    const recognizer = createSpeechRecognizer({ RecognitionCtor: FakeRecognition })
    const onResult = vi.fn()
    recognizer.onResult = onResult
    recognizer.start()

    instances[0].onresult(resultEvent('明日の', '会議'))
    vi.advanceTimersByTime(600)
    // まだ1秒経っていない → 確定しない
    expect(onResult).not.toHaveBeenCalledWith('明日の会議', { isFinal: true })

    // 追加の発話が来ると無音タイマーはリセットされる
    instances[0].onresult(resultEvent('明日の', '会議', 'の準備'))
    vi.advanceTimersByTime(1000)
    expect(onResult).toHaveBeenLastCalledWith('明日の会議の準備', { isFinal: true })
    expect(instances[0].stop).toHaveBeenCalled()
  })

  it('プラットフォームが早期終了しても、無音1秒までは再開して聞き取りを続ける', () => {
    const recognizer = createSpeechRecognizer({ RecognitionCtor: FakeRecognition })
    const onEnd = vi.fn()
    recognizer.onEnd = onEnd
    recognizer.start()

    instances[0].onresult(resultEvent('京都'))
    instances[0].onend() // 早期終了イベント
    expect(instances[0].start).toHaveBeenCalledTimes(2) // 再開した
    expect(onEnd).not.toHaveBeenCalled()

    // 続きの発話
    instances[0].onresult(resultEvent('旅行'))
    vi.advanceTimersByTime(1000)
    expect(onEnd).toHaveBeenCalled()
  })

  it('not-allowed を permission に正規化する', () => {
    const recognizer = createSpeechRecognizer({ RecognitionCtor: FakeRecognition })
    const onError = vi.fn()
    recognizer.onError = onError
    recognizer.start()
    instances[0].onerror({ error: 'not-allowed' })
    expect(onError).toHaveBeenCalledWith('permission')
  })

  it('network エラーを正規化する', () => {
    const recognizer = createSpeechRecognizer({ RecognitionCtor: FakeRecognition })
    const onError = vi.fn()
    recognizer.onError = onError
    recognizer.start()
    instances[0].onerror({ error: 'network' })
    expect(onError).toHaveBeenCalledWith('network')
  })

  it('少し聞き取れた後の no-speech はエラーにせず終了扱い', () => {
    const recognizer = createSpeechRecognizer({ RecognitionCtor: FakeRecognition })
    const onError = vi.fn()
    const onResult = vi.fn()
    recognizer.onError = onError
    recognizer.onResult = onResult
    recognizer.start()
    instances[0].onresult(resultEvent('明日'))
    instances[0].onerror({ error: 'no-speech' })
    expect(onError).not.toHaveBeenCalled()
    expect(onResult).toHaveBeenLastCalledWith('明日', { isFinal: true })
  })

  it('オフライン時は start で onError(offline) を呼び、認識を開始しない', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const recognizer = createSpeechRecognizer({ RecognitionCtor: FakeRecognition })
    const onError = vi.fn()
    recognizer.onError = onError
    recognizer.start()
    expect(onError).toHaveBeenCalledWith('offline')
    expect(instances).toHaveLength(0)
  })

  it('認識器が存在しなければ supported=false', () => {
    const recognizer = createSpeechRecognizer({ RecognitionCtor: null })
    expect(recognizer.supported).toBe(false)
  })
})

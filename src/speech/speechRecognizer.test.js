// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSpeechRecognizer } from './speechRecognizer.js'

let instances = []

class FakeRecognition {
  constructor() {
    instances.push(this)
    this.start = vi.fn()
    this.stop = vi.fn()
  }
}

function resultEvent(transcript, isFinal) {
  const last = [{ transcript }]
  last.isFinal = isFinal
  return { results: [last] }
}

afterEach(() => {
  instances = []
  if (Object.getOwnPropertyDescriptor(navigator, 'onLine')?.configurable) {
    delete navigator.onLine
  }
})

describe('createSpeechRecognizer', () => {
  it('start で ja-JP の認識を開始する', () => {
    const recognizer = createSpeechRecognizer({ RecognitionCtor: FakeRecognition })
    recognizer.start()
    expect(instances).toHaveLength(1)
    expect(instances[0].lang).toBe('ja-JP')
    expect(instances[0].interimResults).toBe(true)
    expect(instances[0].start).toHaveBeenCalled()
  })

  it('認識結果を onResult に渡す', () => {
    const recognizer = createSpeechRecognizer({ RecognitionCtor: FakeRecognition })
    const onResult = vi.fn()
    recognizer.onResult = onResult
    recognizer.start()
    instances[0].onresult(resultEvent('明日の会議', true))
    expect(onResult).toHaveBeenCalledWith('明日の会議', { isFinal: true })
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

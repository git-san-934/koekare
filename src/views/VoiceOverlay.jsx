import { useEffect, useRef, useState } from 'react'
import { createSpeechRecognizer } from '../speech/speechRecognizer.js'
import { parseDateTime } from '../parser/dateTimeParser.js'
import './VoiceOverlay.css'

const ERROR_MESSAGES = {
  permission: 'マイクの使用が許可されていません。端末の設定をご確認ください。',
  'no-speech': '聞き取れませんでした。もう一度お試しください。',
  network: 'ネットワークエラーが発生しました。接続をご確認ください。',
  offline: '音声入力にはネット接続が必要です。手入力もできます。',
  unknown: '音声入力でエラーが発生しました。手入力もできます。',
}

export function VoiceOverlay({
  onParsed,
  onCancel,
  settings,
  recognizerFactory = createSpeechRecognizer,
}) {
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const [listening, setListening] = useState(true)
  const latest = useRef({ onParsed, settings })

  useEffect(() => {
    latest.current = { onParsed, settings }
  })

  useEffect(() => {
    const recognizer = recognizerFactory()
    let done = false

    recognizer.onResult = (text, { isFinal }) => {
      setTranscript(text)
      if (isFinal && !done) {
        done = true
        const { onParsed: cb, settings: s } = latest.current
        cb(parseDateTime(text, { settings: s }))
      }
    }
    recognizer.onError = (code) => {
      setError(code)
      setListening(false)
    }
    recognizer.onEnd = () => {
      setListening(false)
    }
    recognizer.start()

    return () => recognizer.stop()
  }, [recognizerFactory])

  function handleManualInput() {
    latest.current.onParsed({ transcript })
  }

  return (
    <dialog open className="voice-overlay" aria-label="音声入力">
      <button
        type="button"
        className="voice-overlay__cancel"
        onClick={onCancel}
        aria-label="キャンセル"
      >
        ✕
      </button>

      <div className="voice-overlay__body">
        {error ? (
          <>
            <p className="voice-overlay__error">{ERROR_MESSAGES[error] ?? ERROR_MESSAGES.unknown}</p>
            <button type="button" className="voice-overlay__manual" onClick={handleManualInput}>
              手入力する
            </button>
          </>
        ) : (
          <>
            <p className="voice-overlay__status">{listening ? '聞き取り中…' : '処理中…'}</p>
            <p className="voice-overlay__transcript">
              {transcript || '話しかけてください'}
            </p>
          </>
        )}
      </div>
    </dialog>
  )
}

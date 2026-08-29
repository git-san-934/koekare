// ブラウザ音声認識（Web Speech API）の抽象化。
// 将来、外部音声認識APIなど別方式へ差し替えられるよう、このインターフェース
// （supported / start / stop / onResult / onError / onEnd）を境界とする。

function nativeCtor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function isSpeechSupported() {
  return Boolean(nativeCtor())
}

function mapErrorCode(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'permission'
    case 'no-speech':
      return 'no-speech'
    case 'network':
      return 'network'
    default:
      return 'unknown'
  }
}

export function createSpeechRecognizer({ RecognitionCtor } = {}) {
  const Ctor = RecognitionCtor || nativeCtor()
  let recognition = null

  const api = {
    supported: Boolean(Ctor),
    onResult: null,
    onError: null,
    onEnd: null,

    start() {
      if (!Ctor) {
        api.onError?.('unknown')
        return
      }
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        api.onError?.('offline')
        return
      }

      recognition = new Ctor()
      recognition.lang = 'ja-JP'
      recognition.interimResults = true
      recognition.continuous = false
      recognition.maxAlternatives = 1

      recognition.onresult = (event) => {
        const { results } = event
        const latest = results[results.length - 1]
        api.onResult?.(latest[0].transcript, { isFinal: Boolean(latest.isFinal) })
      }
      recognition.onerror = (event) => {
        api.onError?.(mapErrorCode(event.error))
      }
      recognition.onend = () => {
        api.onEnd?.()
      }

      recognition.start()
    },

    stop() {
      recognition?.stop()
    },
  }

  return api
}

// ブラウザ音声認識（Web Speech API）の抽象化。
// 将来、外部音声認識APIなど別方式へ差し替えられるよう、このインターフェース
// （supported / start / stop / onResult / onError / onEnd）を境界とする。
//
// 発話が一瞬途切れただけで終了しないよう、次の制御を自前で行う:
//  - 最後の認識結果から SILENCE_MS ミリ秒 何も来なければ「確定」して終了
//  - プラットフォームが早期に認識を終了しても、予算内なら自動で再開する
//    （iOS Safari は continuous 指定を無視して1発話で終了することがあるため）

const SILENCE_MS = 1000
const MAX_TOTAL_MS = 50000
const MAX_RESTARTS = 5

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
  let silenceTimer = null
  let committed = '' // 過去のサブセッションで確定したテキスト
  let current = '' // 現在のサブセッションのテキスト
  let restarts = 0
  let overallStart = 0
  let manualStop = false
  let done = false
  let endEmitted = false

  const fullText = () => (committed + current).trim()

  function clearSilenceTimer() {
    if (silenceTimer) {
      clearTimeout(silenceTimer)
      silenceTimer = null
    }
  }

  function emitEnd() {
    if (endEmitted) return
    endEmitted = true
    api.onEnd?.()
  }

  function finish({ silent = false } = {}) {
    if (done) return
    done = true
    clearSilenceTimer()
    if (!silent) api.onResult?.(fullText(), { isFinal: true })
    emitEnd()
  }

  function armSilenceTimer() {
    clearSilenceTimer()
    silenceTimer = setTimeout(() => {
      // 発話が SILENCE_MS 途切れた → 確定して認識を止める
      if (done) return
      done = true
      clearSilenceTimer()
      api.onResult?.(fullText(), { isFinal: true })
      try {
        recognition?.stop()
      } catch {
        // stop が失敗しても終了扱いにする
      }
      emitEnd()
    }, SILENCE_MS)
  }

  function bindEvents() {
    recognition.onresult = (event) => {
      let text = ''
      for (const result of event.results) {
        text += result[0].transcript
      }
      current = text
      api.onResult?.(fullText(), { isFinal: false })
      armSilenceTimer()
    }

    recognition.onerror = (event) => {
      const code = mapErrorCode(event.error)
      // 途中まで聞き取れていれば、無音エラーは終了扱い（エラーにしない）
      if (code === 'no-speech' && fullText() !== '') {
        finish()
        return
      }
      clearSilenceTimer()
      done = true
      api.onError?.(code)
    }

    recognition.onend = () => {
      if (manualStop) {
        finish({ silent: true })
        return
      }
      if (done) {
        emitEnd()
        return
      }
      // プラットフォームが早期終了した。予算内なら再開して聞き取り継続。
      committed += current
      current = ''
      const elapsed = Date.now() - overallStart
      if (restarts < MAX_RESTARTS && elapsed < MAX_TOTAL_MS) {
        restarts += 1
        try {
          recognition.start()
          return
        } catch {
          // フォールスルー
        }
      }
      finish()
    }
  }

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

      committed = ''
      current = ''
      restarts = 0
      manualStop = false
      done = false
      endEmitted = false
      overallStart = Date.now()

      recognition = new Ctor()
      recognition.lang = 'ja-JP'
      recognition.interimResults = true
      recognition.continuous = true
      recognition.maxAlternatives = 1
      bindEvents()
      recognition.start()
    },

    stop() {
      manualStop = true
      clearSilenceTimer()
      try {
        recognition?.stop()
      } catch {
        emitEnd()
      }
    },
  }

  return api
}

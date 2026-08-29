import { useEffect, useState } from 'react'
import './StorageNotice.css'

const DISMISS_KEY = 'koekare.storageNoticeDismissed'

// 端末ストレージが「永続化」されていない場合に、バックアップを促す控えめな案内。
export function StorageNotice() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        if (localStorage.getItem(DISMISS_KEY)) return
        if (typeof navigator === 'undefined' || !navigator.storage?.persisted) return
        const persisted = await navigator.storage.persisted()
        if (!cancelled && !persisted) setShow(true)
      } catch {
        // Storage API 非対応なら何も表示しない
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [])

  if (!show) return null

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // localStorage 不可でも表示を消すだけ
    }
    setShow(false)
  }

  return (
    <div className="storage-notice">
      <span>
        予定はこの端末にだけ保存されます。まれに消えることがあるため、メニューから時々バックアップしてください。
      </span>
      <button type="button" onClick={dismiss} aria-label="この案内を閉じる">
        ✕
      </button>
    </div>
  )
}

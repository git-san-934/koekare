import { useState } from 'react'
import { exportEvents, importEvents, BackupError } from '../store/backup.js'
import './BackupMenu.css'

export function BackupMenu({ onClose, onImported, onShowAll }) {
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleExport() {
    setMessage(null)
    setError(null)
    try {
      const { blob, filename } = await exportEvents()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setMessage('予定を書き出しました')
    } catch {
      setError('書き出しに失敗しました')
    }
  }

  async function handleImportFile(event) {
    setMessage(null)
    setError(null)
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const { imported } = await importEvents(text)
      setMessage(`${imported}件の予定を読み込みました`)
      onImported?.()
    } catch (err) {
      setError(err instanceof BackupError ? err.message : '読み込みに失敗しました')
    }
  }

  return (
    <div className="backup-menu">
      <header className="backup-menu__header">
        <button type="button" className="backup-menu__close" onClick={onClose} aria-label="閉じる">
          ✕
        </button>
        <h1 className="backup-menu__heading">メニュー</h1>
      </header>

      <section className="backup-menu__section">
        <button type="button" className="backup-menu__action" onClick={onShowAll}>
          すべての予定を一覧で見る
        </button>
      </section>

      <section className="backup-menu__section">
        <h2 className="backup-menu__section-title">データのバックアップ</h2>
        <p className="backup-menu__note">
          予定はこの端末の中だけに保存されます。機種変更や不具合に備えて、ときどき書き出して保存してください。
        </p>
        <button type="button" className="backup-menu__action" onClick={handleExport}>
          すべての予定を書き出す
        </button>
        <label className="backup-menu__action">
          ファイルから読み込む
          <input
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="backup-menu__file"
          />
        </label>
      </section>

      {message && <p className="backup-menu__message">{message}</p>}
      {error && <p className="backup-menu__error">{error}</p>}
    </div>
  )
}

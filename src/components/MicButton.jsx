import './MicButton.css'

export function MicButton({ disabled, onStart }) {
  return (
    <button
      type="button"
      className="mic-button"
      aria-label={disabled ? '音声入力は利用できません（ネット接続が必要です）' : '音声で予定を追加'}
      disabled={disabled}
      onClick={onStart}
    >
      <span aria-hidden="true">🎤</span>
    </button>
  )
}

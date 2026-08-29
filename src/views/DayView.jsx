import { formatDayHeader } from '../datetime.js'
import { EventListItem } from '../components/EventListItem.jsx'
import { MicButton } from '../components/MicButton.jsx'
import './DayView.css'

export function DayView({
  date,
  events,
  loading,
  onPrevDay,
  onNextDay,
  onToday,
  onOpenMonth,
  onOpenMenu,
  onNewEvent,
  onEditEvent,
  onStartVoice,
  voiceSupported,
}) {
  return (
    <div className="day-view">
      <header className="day-view__header">
        <button type="button" className="day-view__icon" onClick={onOpenMenu} aria-label="メニュー">
          ☰
        </button>
        <div className="day-view__nav">
          <button type="button" className="day-view__icon" onClick={onPrevDay} aria-label="前の日">
            ‹
          </button>
          <button type="button" className="day-view__date" onClick={onToday}>
            {formatDayHeader(date)}
          </button>
          <button type="button" className="day-view__icon" onClick={onNextDay} aria-label="次の日">
            ›
          </button>
        </div>
        <button type="button" className="day-view__icon" onClick={onOpenMonth} aria-label="月表示">
          月
        </button>
      </header>

      <main className="day-view__list">
        {loading ? (
          <p className="day-view__empty">読み込み中…</p>
        ) : events.length === 0 ? (
          <p className="day-view__empty">予定なし</p>
        ) : (
          events.map((event) => (
            <EventListItem key={event.id} event={event} onClick={onEditEvent} />
          ))
        )}
      </main>

      <footer className="day-view__footer">
        <button
          type="button"
          className="day-view__add"
          onClick={onNewEvent}
          aria-label="手入力で予定を追加"
        >
          ＋
        </button>
        <MicButton disabled={!voiceSupported} onStart={onStartVoice} />
      </footer>
    </div>
  )
}

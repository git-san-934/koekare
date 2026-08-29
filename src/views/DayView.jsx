import { formatDayHeader } from '../datetime.js'
import { EventListItem } from '../components/EventListItem.jsx'
import { MicButton } from '../components/MicButton.jsx'
import { useSwipe } from '../hooks/useSwipe.js'
import './DayView.css'

export function DayView({
  date,
  events,
  loading,
  notice,
  onPrevDay,
  onNextDay,
  onToday,
  onOpenMonth,
  onOpenMenu,
  onShowAll,
  onExport,
  onNewEvent,
  onEditEvent,
  onStartVoice,
  voiceSupported,
}) {
  // 左スワイプで翌日、右スワイプで前日
  const swipe = useSwipe({ onSwipeLeft: onNextDay, onSwipeRight: onPrevDay })

  return (
    <div className="day-view" {...swipe}>
      <header className="day-view__header">
        <button type="button" className="day-view__icon" onClick={onOpenMenu} aria-label="メニュー">
          ☰
        </button>
        <button
          type="button"
          className="day-view__date"
          onClick={onOpenMonth}
          aria-label="カレンダーで日付を選ぶ"
        >
          {formatDayHeader(date)}
        </button>
        <button type="button" className="day-view__icon" onClick={onPrevDay} aria-label="前の日">
          ‹
        </button>
        <button type="button" className="day-view__icon" onClick={onNextDay} aria-label="次の日">
          ›
        </button>
        <button
          type="button"
          className="day-view__icon day-view__month-btn"
          onClick={onToday}
          aria-label="今日に移動"
        >
          今日
        </button>
      </header>

      {notice}

      <main className="day-view__list">
        {loading ? (
          <p className="day-view__empty">読み込み中…</p>
        ) : events.length === 0 ? (
          <p className="day-view__empty">予定なし</p>
        ) : (
          <ul className="day-view__items">
            {events.map((event) => (
              <EventListItem key={event.id} event={event} onClick={onEditEvent} />
            ))}
          </ul>
        )}
      </main>

      <footer className="day-view__footer">
        <button
          type="button"
          className="day-view__all-btn"
          onClick={onShowAll}
          aria-label="すべての予定を一覧で見る"
        >
          <span aria-hidden="true">📋</span>
        </button>
        <button
          type="button"
          className="day-view__export-btn"
          onClick={onExport}
          aria-label="すべての予定をファイルに書き出す"
        >
          <span aria-hidden="true">💾</span>
        </button>
        <div className="day-view__footer-right">
          <button
            type="button"
            className="day-view__add"
            onClick={onNewEvent}
            aria-label="手入力で予定を追加"
          >
            ＋
          </button>
          <MicButton disabled={!voiceSupported} onStart={onStartVoice} />
        </div>
      </footer>
    </div>
  )
}

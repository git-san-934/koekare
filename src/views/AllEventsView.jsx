import { useMemo } from 'react'
import { useEvents } from '../hooks/useEvents.js'
import { fromISO, formatTime, formatDateWithYear, formatISODate, formatAllDayLabel } from '../datetime.js'
import './AllEventsView.css'

function groupByDate(events) {
  const map = new Map()
  for (const event of events) {
    const key = formatISODate(fromISO(event.startAt))
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(event)
  }
  // events はストアで startAt 昇順なので、Map の挿入順＝日付昇順
  return [...map.values()].map((dayEvents) => ({
    label: formatDateWithYear(fromISO(dayEvents[0].startAt)),
    dayEvents,
  }))
}

export function AllEventsView({ onClose, onEditEvent }) {
  const { events, loading } = useEvents()
  const groups = useMemo(() => groupByDate(events), [events])

  return (
    <div className="all-events">
      <header className="all-events__header">
        <button type="button" className="all-events__close" onClick={onClose} aria-label="閉じる">
          ✕
        </button>
        <h1 className="all-events__heading">すべての予定</h1>
        {!loading && <span className="all-events__count">全{events.length}件</span>}
      </header>

      {loading ? (
        <p className="all-events__empty">読み込み中…</p>
      ) : events.length === 0 ? (
        <p className="all-events__empty">予定はありません</p>
      ) : (
        <div className="all-events__body">
          {groups.map(({ label, dayEvents }) => (
            <section key={label} className="all-events__group">
              <h2 className="all-events__date">{label}</h2>
              <ul className="all-events__list">
                {dayEvents.map((event) => (
                  <li key={event.id} className="all-events__item">
                    <button
                      type="button"
                      className="all-events__button"
                      onClick={() => onEditEvent(event)}
                    >
                      <span className="all-events__time">
                        {event.allDay
                          ? formatAllDayLabel(event.startAt, event.endAt)
                          : `${formatTime(fromISO(event.startAt))}–${formatTime(fromISO(event.endAt))}`}
                      </span>
                      <span className="all-events__title">{event.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

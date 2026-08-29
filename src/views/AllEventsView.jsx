import { useMemo } from 'react'
import { useEvents } from '../hooks/useEvents.js'
import {
  fromISO,
  formatTime,
  formatDateWithYear,
  formatISODate,
  formatAllDayLabel,
  startOfDayLocal,
  addDays,
} from '../datetime.js'
import './AllEventsView.css'

// 予定を日付ごとに割り当てる。複数日にわたる終日予定は、期間中の各日に表示する。
function groupByDate(events) {
  const map = new Map()
  const assign = (day, event) => {
    const key = formatISODate(day)
    if (!map.has(key)) {
      map.set(key, { key, label: formatDateWithYear(day), items: [] })
    }
    map.get(key).items.push(event)
  }

  for (const event of events) {
    const startDay = startOfDayLocal(fromISO(event.startAt))
    if (event.allDay) {
      // endAt は「最終日の翌日 0:00」（排他的終端）なので 1 日戻す
      const lastDay = addDays(startOfDayLocal(fromISO(event.endAt)), -1)
      for (let day = startDay; day.getTime() <= lastDay.getTime(); day = addDays(day, 1)) {
        assign(day, event)
      }
    } else {
      assign(startDay, event)
    }
  }
  // events はストアで startAt 昇順なので、Map の挿入順＝日付昇順
  return [...map.values()]
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

      <button
        type="button"
        className="all-events__back-btn"
        onClick={onClose}
        aria-label="日別表示に戻る"
      >
        <span aria-hidden="true">📋</span>
      </button>

      {loading ? (
        <p className="all-events__empty">読み込み中…</p>
      ) : events.length === 0 ? (
        <p className="all-events__empty">予定はありません</p>
      ) : (
        <div className="all-events__body">
          {groups.map((group) => (
            <section key={group.key} className="all-events__group">
              <h2 className="all-events__date">{group.label}</h2>
              <ul className="all-events__list">
                {group.items.map((event) => (
                  <li key={`${group.key}-${event.id}`} className="all-events__item">
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

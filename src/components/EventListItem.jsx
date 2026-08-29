import { fromISO, formatTime } from '../datetime.js'
import './EventListItem.css'

export function EventListItem({ event, onClick }) {
  const start = formatTime(fromISO(event.startAt))
  const timeLabel = event.allDay
    ? '終日'
    : event.endAt
      ? `${start}–${formatTime(fromISO(event.endAt))}`
      : start

  return (
    <li className="event-item">
      <button type="button" className="event-item__button" onClick={() => onClick(event)}>
        <span className="event-item__time">{timeLabel}</span>
        <span className="event-item__title">{event.title}</span>
      </button>
    </li>
  )
}

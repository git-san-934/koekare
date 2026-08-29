import { fromISO, formatTime, formatAllDayLabel } from '../datetime.js'
import './EventListItem.css'

export function EventListItem({ event, onClick }) {
  const timeLabel = event.allDay
    ? formatAllDayLabel(event.startAt, event.endAt)
    : event.endAt
      ? `${formatTime(fromISO(event.startAt))}–${formatTime(fromISO(event.endAt))}`
      : formatTime(fromISO(event.startAt))

  return (
    <li className="event-item">
      <button type="button" className="event-item__button" onClick={() => onClick(event)}>
        <span className="event-item__time">{timeLabel}</span>
        <span className="event-item__title">{event.title}</span>
      </button>
    </li>
  )
}

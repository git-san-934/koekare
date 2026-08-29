import { fromISO, formatTime } from '../datetime.js'
import './EventListItem.css'

export function EventListItem({ event, onClick }) {
  return (
    <button type="button" className="event-item" onClick={() => onClick(event)}>
      <span className="event-item__time">
        {event.allDay ? '終日' : formatTime(fromISO(event.startAt))}
      </span>
      <span className="event-item__title">{event.title}</span>
    </button>
  )
}

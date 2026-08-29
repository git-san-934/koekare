import {
  formatMonthTitle,
  formatISODate,
  monthGridDays,
  isSameMonth,
  isSameDay,
} from '../datetime.js'
import './MonthView.css'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export function MonthView({
  month,
  daysWithEvents,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onBack,
}) {
  const days = monthGridDays(month)
  const today = new Date()

  return (
    <div className="month-view">
      <header className="month-view__header">
        <button type="button" className="month-view__back" onClick={onBack} aria-label="日表示に戻る">
          ‹ 日
        </button>
        <div className="month-view__nav">
          <button type="button" className="month-view__icon" onClick={onPrevMonth} aria-label="前の月">
            ‹
          </button>
          <span className="month-view__title">{formatMonthTitle(month)}</span>
          <button type="button" className="month-view__icon" onClick={onNextMonth} aria-label="次の月">
            ›
          </button>
        </div>
      </header>

      <div className="month-view__weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w} className="month-view__weekday">
            {w}
          </div>
        ))}
      </div>

      <div className="month-view__grid">
        {days.map((day) => {
          const iso = formatISODate(day)
          const classes = ['month-view__day']
          if (!isSameMonth(day, month)) classes.push('month-view__day--other')
          if (isSameDay(day, today)) classes.push('month-view__day--today')
          return (
            <button
              key={iso}
              type="button"
              className={classes.join(' ')}
              onClick={() => onSelectDate(day)}
            >
              <span className="month-view__daynum">{day.getDate()}</span>
              {daysWithEvents.has(iso) && (
                <span className="month-view__dot" aria-label="予定あり" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

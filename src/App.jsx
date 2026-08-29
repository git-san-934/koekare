import { useMemo, useState } from 'react'
import { DayView } from './views/DayView.jsx'
import { MonthView } from './views/MonthView.jsx'
import { useEvents } from './hooks/useEvents.js'
import {
  startOfDayLocal,
  addDays,
  addMonths,
  formatISODate,
  fromISO,
  monthGridDays,
} from './datetime.js'

export default function App() {
  const [view, setView] = useState('day')
  const [selectedDate, setSelectedDate] = useState(() => startOfDayLocal(new Date()))
  const [monthDate, setMonthDate] = useState(() => startOfDayLocal(new Date()))

  const range = useMemo(() => {
    if (view === 'month') {
      const grid = monthGridDays(monthDate)
      return { from: grid[0], to: addDays(grid[grid.length - 1], 1) }
    }
    return { from: selectedDate, to: addDays(selectedDate, 1) }
  }, [view, selectedDate, monthDate])

  const { events, loading } = useEvents(range)

  const daysWithEvents = useMemo(() => {
    const set = new Set()
    for (const event of events) {
      set.add(formatISODate(fromISO(event.startAt)))
    }
    return set
  }, [events])

  if (view === 'month') {
    return (
      <MonthView
        month={monthDate}
        daysWithEvents={daysWithEvents}
        onPrevMonth={() => setMonthDate((d) => addMonths(d, -1))}
        onNextMonth={() => setMonthDate((d) => addMonths(d, 1))}
        onSelectDate={(day) => {
          setSelectedDate(startOfDayLocal(day))
          setView('day')
        }}
        onBack={() => setView('day')}
      />
    )
  }

  return (
    <DayView
      date={selectedDate}
      events={events}
      loading={loading}
      onPrevDay={() => setSelectedDate((d) => addDays(d, -1))}
      onNextDay={() => setSelectedDate((d) => addDays(d, 1))}
      onToday={() => setSelectedDate(startOfDayLocal(new Date()))}
      onOpenMonth={() => {
        setMonthDate(selectedDate)
        setView('month')
      }}
      onOpenMenu={() => {}}
      onNewEvent={() => {}}
      onEditEvent={() => {}}
      onStartVoice={() => {}}
      voiceSupported={false}
    />
  )
}

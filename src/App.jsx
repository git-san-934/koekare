import { useCallback, useMemo, useState } from 'react'
import { DayView } from './views/DayView.jsx'
import { MonthView } from './views/MonthView.jsx'
import { EventForm } from './views/EventForm.jsx'
import { VoiceOverlay } from './views/VoiceOverlay.jsx'
import { BackupMenu } from './views/BackupMenu.jsx'
import { useEvents } from './hooks/useEvents.js'
import { isSpeechSupported } from './speech/speechRecognizer.js'
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
  const [draft, setDraft] = useState(null)
  const [recognizing, setRecognizing] = useState(false)

  const voiceSupported = useMemo(() => isSpeechSupported(), [])

  const range = useMemo(() => {
    if (view === 'month') {
      const grid = monthGridDays(monthDate)
      return { from: grid[0], to: addDays(grid[grid.length - 1], 1) }
    }
    return { from: selectedDate, to: addDays(selectedDate, 1) }
  }, [view, selectedDate, monthDate])

  const { events, loading, reload } = useEvents(range)

  const daysWithEvents = useMemo(() => {
    const set = new Set()
    for (const event of events) {
      set.add(formatISODate(fromISO(event.startAt)))
    }
    return set
  }, [events])

  const handleParsed = useCallback((parsed) => {
    setRecognizing(false)
    setDraft({ ...parsed, source: 'voice' })
    setView('form')
  }, [])

  function openNewEvent() {
    setDraft({})
    setView('form')
  }

  function openEditEvent(event) {
    setDraft(event)
    setView('form')
  }

  async function handleSaved(saved) {
    setSelectedDate(startOfDayLocal(fromISO(saved.startAt)))
    setDraft(null)
    setView('day')
    await reload()
  }

  async function handleDeleted() {
    setDraft(null)
    setView('day')
    await reload()
  }

  function handleCancel() {
    setDraft(null)
    setView('day')
  }

  if (view === 'backup') {
    return <BackupMenu onClose={() => setView('day')} onImported={reload} />
  }

  if (view === 'form') {
    return (
      <EventForm
        initial={draft}
        selectedDate={selectedDate}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        onCancel={handleCancel}
      />
    )
  }

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
    <>
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
        onOpenMenu={() => setView('backup')}
        onNewEvent={openNewEvent}
        onEditEvent={openEditEvent}
        onStartVoice={() => setRecognizing(true)}
        voiceSupported={voiceSupported}
      />
      {recognizing && (
        <VoiceOverlay onParsed={handleParsed} onCancel={() => setRecognizing(false)} />
      )}
    </>
  )
}

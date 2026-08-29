import { useCallback, useMemo, useState } from 'react'
import { DayView } from './views/DayView.jsx'
import { MonthView } from './views/MonthView.jsx'
import { EventForm } from './views/EventForm.jsx'
import { VoiceOverlay } from './views/VoiceOverlay.jsx'
import { BackupMenu } from './views/BackupMenu.jsx'
import { AllEventsView } from './views/AllEventsView.jsx'
import { StorageNotice } from './components/StorageNotice.jsx'
import { useEvents } from './hooks/useEvents.js'
import { isSpeechSupported } from './speech/speechRecognizer.js'
import { saveEventsToFile } from './store/backup.js'
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
  // フォームを閉じたときに戻る画面（'day' または 'all'）
  const [formOrigin, setFormOrigin] = useState('day')

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
      let day = startOfDayLocal(fromISO(event.startAt))
      const endDay = startOfDayLocal(fromISO(event.endAt))
      // 終日の endAt は排他的終端なので1日戻す。最低でも開始日はマークする。
      const lastDay = event.allDay ? addDays(endDay, -1) : endDay
      while (day.getTime() <= lastDay.getTime()) {
        set.add(formatISODate(day))
        day = addDays(day, 1)
      }
    }
    return set
  }, [events])

  const handleParsed = useCallback((parsed) => {
    setRecognizing(false)
    setFormOrigin('day')
    setDraft({ ...parsed, source: 'voice' })
    setView('form')
  }, [])

  function openNewEvent() {
    setFormOrigin('day')
    setDraft({})
    setView('form')
  }

  function openEditEvent(event) {
    setFormOrigin(view === 'all' ? 'all' : 'day')
    setDraft(event)
    setView('form')
  }

  async function handleSaved(saved) {
    if (formOrigin === 'day') {
      setSelectedDate(startOfDayLocal(fromISO(saved.startAt)))
    }
    setDraft(null)
    setView(formOrigin)
    await reload()
  }

  async function handleDeleted() {
    setDraft(null)
    setView(formOrigin)
    await reload()
  }

  function handleCancel() {
    setDraft(null)
    setView(formOrigin)
  }

  async function handleExport() {
    try {
      await saveEventsToFile()
    } catch {
      // ダウンロードに失敗しても操作は継続できる
    }
  }

  if (view === 'backup') {
    return (
      <BackupMenu onClose={() => setView('day')} onImported={reload} />
    )
  }

  if (view === 'all') {
    return <AllEventsView onClose={() => setView('day')} onEditEvent={openEditEvent} />
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
        notice={<StorageNotice />}
        onPrevDay={() => setSelectedDate((d) => addDays(d, -1))}
        onNextDay={() => setSelectedDate((d) => addDays(d, 1))}
        onToday={() => setSelectedDate(startOfDayLocal(new Date()))}
        onOpenMonth={() => {
          setMonthDate(selectedDate)
          setView('month')
        }}
        onOpenMenu={() => setView('backup')}
        onShowAll={() => setView('all')}
        onExport={handleExport}
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

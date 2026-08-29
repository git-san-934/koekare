import { useState } from 'react'
import * as eventStore from '../store/eventStore.js'
import { ValidationError } from '../domain/event.js'
import { DEFAULT_DURATION_MINUTES } from '../domain/settings.js'
import { DateField } from '../components/DateField.jsx'
import { TimeField } from '../components/TimeField.jsx'
import {
  formatISODate,
  isoToDateInput,
  isoToTimeInput,
  combineDateAndTime,
  startOfDayLocal,
  addMinutes,
  toISO,
} from '../datetime.js'
import './EventForm.css'

function deriveFields(initial, selectedDate) {
  const hasStart = Boolean(initial?.id) || typeof initial?.startAt === 'string'
  if (hasStart) {
    return {
      title: initial.title ?? '',
      dateStr: isoToDateInput(initial.startAt),
      allDay: Boolean(initial.allDay),
      startTime: initial.allDay ? '' : isoToTimeInput(initial.startAt),
      endTime: initial.allDay || !initial.endAt ? '' : isoToTimeInput(initial.endAt),
    }
  }
  return {
    title: initial?.title ?? '',
    dateStr: initial?.dateOnly ?? formatISODate(selectedDate),
    allDay: Boolean(initial?.allDay),
    startTime: '',
    endTime: '',
  }
}

export function EventForm({ initial, selectedDate, onSaved, onDeleted, onCancel }) {
  const isEdit = Boolean(initial?.id)
  const transcript = typeof initial?.transcript === 'string' ? initial.transcript : null
  const [fields, setFields] = useState(() => deriveFields(initial, selectedDate))
  const [errors, setErrors] = useState([])
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const patch = (next) => setFields((f) => ({ ...f, ...next }))

  function buildPayload() {
    if (fields.allDay) {
      return {
        title: fields.title,
        startAt: toISO(startOfDayLocal(combineDateAndTime(fields.dateStr, '00:00'))),
        allDay: true,
      }
    }
    const start = combineDateAndTime(fields.dateStr, fields.startTime)
    const end = fields.endTime
      ? combineDateAndTime(fields.dateStr, fields.endTime)
      : addMinutes(start, DEFAULT_DURATION_MINUTES)
    return {
      title: fields.title,
      startAt: toISO(start),
      endAt: toISO(end),
      allDay: false,
    }
  }

  async function handleSave() {
    const localErrors = []
    if (!fields.title.trim()) localErrors.push('タイトルを入力してください')
    if (!fields.allDay && !fields.startTime) localErrors.push('開始時刻を入力してください')
    if (localErrors.length > 0) {
      setErrors(localErrors)
      return
    }

    try {
      const payload = buildPayload()
      const saved = isEdit
        ? await eventStore.update(initial.id, payload)
        : await eventStore.add({ ...payload, source: initial?.source === 'voice' ? 'voice' : 'manual' })
      onSaved(saved)
    } catch (e) {
      setErrors(e instanceof ValidationError ? e.errors : [e.message || '保存できませんでした'])
    }
  }

  async function handleDelete() {
    await eventStore.remove(initial.id)
    onDeleted(initial.id)
  }

  return (
    <div className="event-form">
      <header className="event-form__header">
        <button type="button" className="event-form__cancel" onClick={onCancel}>
          ✕
        </button>
        <button type="button" className="event-form__save" onClick={handleSave}>
          保存
        </button>
      </header>

      {transcript !== null && (
        <p className="event-form__transcript">
          聞き取った内容：「{transcript || '（聞き取れませんでした）'}」
        </p>
      )}

      {errors.length > 0 && (
        <ul className="event-form__errors">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <div className="event-form__body">
        <div className="field field--text">
          <label htmlFor="event-title" className="field__label">
            タイトル
          </label>
          <input
            id="event-title"
            className="field__input"
            type="text"
            placeholder="予定のタイトル"
            value={fields.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </div>

        <DateField
          id="event-date"
          label="日付"
          value={fields.dateStr}
          onChange={(dateStr) => patch({ dateStr })}
        />

        <div className="field">
          <label htmlFor="event-allday" className="field__label">
            終日
          </label>
          <input
            id="event-allday"
            type="checkbox"
            checked={fields.allDay}
            onChange={(e) => patch({ allDay: e.target.checked })}
          />
        </div>

        <TimeField
          id="event-start"
          label="開始"
          value={fields.startTime}
          disabled={fields.allDay}
          onChange={(startTime) => patch({ startTime })}
        />
        <TimeField
          id="event-end"
          label="終了"
          value={fields.endTime}
          disabled={fields.allDay}
          onChange={(endTime) => patch({ endTime })}
        />
      </div>

      {isEdit && (
        <div className="event-form__delete">
          {confirmingDelete ? (
            <>
              <span>この予定を削除しますか？</span>
              <button type="button" className="event-form__delete-confirm" onClick={handleDelete}>
                削除する
              </button>
              <button type="button" onClick={() => setConfirmingDelete(false)}>
                やめる
              </button>
            </>
          ) : (
            <button
              type="button"
              className="event-form__delete-start"
              onClick={() => setConfirmingDelete(true)}
            >
              この予定を削除
            </button>
          )}
        </div>
      )}
    </div>
  )
}

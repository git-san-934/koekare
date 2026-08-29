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
  addDays,
  addMinutes,
  fromISO,
  toISO,
} from '../datetime.js'
import './EventForm.css'

function deriveFields(initial, selectedDate) {
  const hasStart = Boolean(initial?.id) || typeof initial?.startAt === 'string'
  if (hasStart) {
    const allDay = Boolean(initial.allDay)
    const startDate = isoToDateInput(initial.startAt)
    // 終日の endAt は「翌日0:00」の排他的終端なので、表示用に1日戻す
    const endDate =
      allDay && initial.endAt ? isoToDateInput(toISO(addDays(fromISO(initial.endAt), -1))) : startDate
    return {
      title: initial.title ?? '',
      startDate,
      endDate,
      allDay,
      startTime: allDay ? '' : isoToTimeInput(initial.startAt),
      endTime: allDay || !initial.endAt ? '' : isoToTimeInput(initial.endAt),
    }
  }
  const startDate = initial?.dateOnly ?? formatISODate(selectedDate)
  return {
    title: initial?.title ?? '',
    startDate,
    endDate: startDate,
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
      const startDay = startOfDayLocal(combineDateAndTime(fields.startDate, '00:00'))
      const endDay = startOfDayLocal(
        combineDateAndTime(fields.endDate || fields.startDate, '00:00'),
      )
      return {
        title: fields.title,
        startAt: toISO(startDay),
        endAt: toISO(addDays(endDay, 1)), // 排他的終端（最終日の翌日0:00）
        allDay: true,
      }
    }
    const start = combineDateAndTime(fields.startDate, fields.startTime)
    const end = fields.endTime
      ? combineDateAndTime(fields.startDate, fields.endTime)
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
    if (fields.allDay && fields.endDate && fields.endDate < fields.startDate) {
      localErrors.push('終了日は開始日以降にしてください')
    }
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

        {fields.allDay ? (
          <>
            <DateField
              id="event-start-date"
              label="開始日"
              value={fields.startDate}
              onChange={(startDate) => patch({ startDate })}
            />
            <DateField
              id="event-end-date"
              label="終了日"
              value={fields.endDate}
              onChange={(endDate) => patch({ endDate })}
            />
          </>
        ) : (
          <>
            <DateField
              id="event-date"
              label="日付"
              value={fields.startDate}
              onChange={(date) => patch({ startDate: date, endDate: date })}
            />
            <TimeField
              id="event-start"
              label="開始"
              value={fields.startTime}
              onChange={(startTime) => patch({ startTime })}
            />
            <TimeField
              id="event-end"
              label="終了"
              value={fields.endTime}
              onChange={(endTime) => patch({ endTime })}
            />
          </>
        )}
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

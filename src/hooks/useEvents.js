import { useState, useEffect, useCallback } from 'react'
import * as eventStore from '../store/eventStore.js'

// 指定範囲の予定を読み込み、保持する。追加・更新・削除は呼び出し側でストアを
// 操作してから reload() を呼ぶ。
export function useEvents(range) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fromMs = range?.from ? range.from.getTime() : null
  const toMs = range?.to ? range.to.getTime() : null

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const query = fromMs && toMs ? { from: new Date(fromMs), to: new Date(toMs) } : undefined
      setEvents(await eventStore.list(query))
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [fromMs, toMs])

  // IndexedDB（外部システム）との同期。範囲が変わるたびに読み直す。
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- 外部ストアの非同期読み込み（正当な用途）
    reload()
  }, [reload])

  return { events, loading, error, reload }
}

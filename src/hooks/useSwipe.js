import { useRef } from 'react'

const DISTANCE_THRESHOLD = 50 // これ以上の横移動でスワイプとみなす（px）
const OFF_AXIS_RATIO = 1 // 縦移動が横移動より大きければ（スクロール）無視

// 横スワイプを検出する。返り値を要素に spread して使う。
export function useSwipe({ onSwipeLeft, onSwipeRight }) {
  const start = useRef(null)

  function onTouchStart(event) {
    const touch = event.touches?.[0]
    if (!touch) return
    start.current = { x: touch.clientX, y: touch.clientY }
  }

  function onTouchEnd(event) {
    const origin = start.current
    start.current = null
    const touch = event.changedTouches?.[0]
    if (!origin || !touch) return

    const dx = touch.clientX - origin.x
    const dy = touch.clientY - origin.y
    if (Math.abs(dx) < DISTANCE_THRESHOLD) return
    if (Math.abs(dy) > Math.abs(dx) * OFF_AXIS_RATIO) return

    if (dx < 0) onSwipeLeft?.()
    else onSwipeRight?.()
  }

  return { onTouchStart, onTouchEnd }
}

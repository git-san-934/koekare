// 予定の既定値・日時推測が参照する調整値。MVPでは編集UIを設けず既定値を使う。

export const DEFAULT_DURATION_MINUTES = 60

export const DEFAULT_SETTINGS = {
  defaultDurationMinutes: DEFAULT_DURATION_MINUTES,
  morningHour: 9,
  noonHour: 12,
  eveningHour: 17,
  nightHour: 19,
}

// 保存レコード（key を含む場合がある）や部分指定を、既定値で埋めた Settings にする。
export function withDefaults(partial) {
  const source = partial && typeof partial === 'object' ? partial : {}
  return {
    defaultDurationMinutes: numberOr(source.defaultDurationMinutes, DEFAULT_SETTINGS.defaultDurationMinutes),
    morningHour: numberOr(source.morningHour, DEFAULT_SETTINGS.morningHour),
    noonHour: numberOr(source.noonHour, DEFAULT_SETTINGS.noonHour),
    eveningHour: numberOr(source.eveningHour, DEFAULT_SETTINGS.eveningHour),
    nightHour: numberOr(source.nightHour, DEFAULT_SETTINGS.nightHour),
  }
}

function numberOr(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

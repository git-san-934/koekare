// 認識テキストの表記ゆれを吸収する。
// - Unicode NFKC で全角英数・記号を半角へ
// - 連続空白の圧縮
// - 漢数字（0〜99）を算用数字へ（「三時半」「十五時」「二十三日」等に対応）

const KANJI_DIGITS = {
  〇: 0, 零: 0,
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5,
  六: 6, 七: 7, 八: 8, 九: 9,
}

function kanjiChunkToNumber(chunk) {
  if (chunk.includes('十')) {
    const [tensPart, onesPart] = chunk.split('十')
    const tens = tensPart === '' ? 1 : KANJI_DIGITS[tensPart]
    const ones = onesPart === '' ? 0 : KANJI_DIGITS[onesPart]
    if (tens === undefined || ones === undefined) return null
    return tens * 10 + ones
  }
  if (chunk.length === 1 && chunk in KANJI_DIGITS) return KANJI_DIGITS[chunk]
  return null
}

export function convertKanjiNumerals(text) {
  return text.replace(/[〇零一二三四五六七八九十]+/g, (match) => {
    const value = kanjiChunkToNumber(match)
    return value === null ? match : String(value)
  })
}

export function normalize(text) {
  if (typeof text !== 'string') return ''
  let result = text.normalize('NFKC')
  result = result.replace(/\s+/g, ' ').trim()
  result = convertKanjiNumerals(result)
  return result
}

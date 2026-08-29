# 初回実装 設計

`requirements.md` の8段階を実装するための、モジュール単位の設計。`docs/functional-design.md`（画面・データモデル・日時推測）と `docs/architecture.md`（技術選定・制約）を前提とし、本書はそれらを実装レベルへ具体化する。基本設計に変更が生じた箇所は「恒久ドキュメントへの反映」節に記す。

## 実装アプローチ

- **状態管理**: グローバルステート用ライブラリは使わない。`App.jsx` が画面横断の状態（表示中の画面、選択日、編集対象、音声認識中フラグ）を持ち、子へ props で渡す。予定一覧は `useEvents(range)` カスタムフックが `eventStore` をラップして保持し、追加・更新・削除後に再取得する。
- **レイヤ分離**: `src/domain/` ・ `src/parser/` はブラウザAPI・Reactに非依存の純粋関数。`src/store/` ・ `src/speech/` がブラウザAPI（IndexedDB / Web Speech / `navigator.storage`）との境界。`src/views/` ・ `src/components/` は表示と操作のみで、ロジックを持たない。
- **非同期**: ストア関数はすべて `async` で Promise を返す。UI 側は `async/await` + ローディング/エラー状態で扱う。
- **日時の扱い**: 内部保持は ISO 8601 文字列（端末オフセット付き）。生成・整形・曜日計算は必ず `src/datetime.js`（`date-fns` ラッパー）を経由する。

## データ構造

### Event（`events` オブジェクトストア、keyPath `id`）

```js
{
  id: string,          // crypto.randomUUID()
  title: string,       // 1文字以上
  startAt: string,     // ISO 8601 例 '2026-08-30T15:00:00+09:00'
  endAt: string,       // ISO 8601、startAt 以降
  allDay: boolean,     // true のとき startAt=その日00:00、endAt=翌日00:00 で保存
  source: 'voice' | 'manual',
  createdAt: string,   // ISO 8601
  updatedAt: string,   // ISO 8601
}
```

- インデックス `by_start`（`startAt`）。日別・月別の範囲検索と書き出しの並び順に使う。
- 終日予定も `startAt` に日付境界の時刻を入れることで、時刻付き予定と同じ範囲クエリで拾える。

### Settings（`settings` オブジェクトストア、keyPath `key`、単一レコード `key: 'app'`）

```js
{
  key: 'app',
  defaultDurationMinutes: 60,
  morningHour: 9,
  noonHour: 12,
  eveningHour: 17,
  nightHour: 19,
}
```

MVPでは編集UIなし。`settingsStore.get()` はレコードがなければ既定値を返す。

### ParsedDateTime（日時推測エンジンの出力）

```js
{
  startAt?: string,   // 日付だけ取れて時刻不明なら返さない
  endAt?: string,
  allDay?: boolean,
  title?: string,     // 空になるなら返さない
  transcript: string, // 推測元テキスト（フォーム上部に表示）
}
```

### バックアップJSON（`schemaVersion: 1`）

`docs/architecture.md`「書き出しファイル形式」の構造に従う。`events` は `Event` の配列（`key` は含まない）。

## モジュール別設計

### `src/domain/event.js`（純粋）

| 関数 | シグネチャ | 内容 |
|---|---|---|
| `createEvent` | `({ title, startAt, endAt, allDay, source }, { settings, now }) => Event` | `id` 採番、`endAt` 未指定なら `startAt + defaultDurationMinutes`、`createdAt/updatedAt = now`、`validateEvent` を通す |
| `applyChanges` | `(event, changes, { now }) => Event` | 変更をマージし `updatedAt = now`、`validateEvent` を通す |
| `validateEvent` | `(event) => string[]` | エラーメッセージ配列（空なら妥当）。`title` 非空、`startAt/endAt` が有効な日時、`endAt >= startAt` |

### `src/domain/settings.js`（純粋）

`DEFAULT_SETTINGS` 定数と `withDefaults(partial) => Settings`。定数 `DEFAULT_DURATION_MINUTES = 60` 等をここに集約。

### `src/datetime.js`（`date-fns` ラッパー）

`toISO(date)` / `fromISO(str)` / `startOfDayLocal(date)` / `addDays` / `addMinutes` / `setTime(date, h, m)` / `formatDayHeader(date)`（`'8月29日(金)'`）/ `formatTime(date)`（`'15:00'`）/ `formatMonthTitle(date)`（`'2026年8月'`）/ `getWeekday(date)` / `nextOccurrenceOfWeekday(now, weekday, { allowToday })` / `upcomingSaturday(now)`。

### `src/parser/normalize.js`（純粋）

`normalize(text) => string`: Unicode NFKC 正規化、全角英数→半角、連続空白の圧縮、前後トリム、漢数字→算用数字の変換（0〜59の範囲のみ。「三時半」「十五時」等に対応）。

### `src/parser/rules/dateRules.js`（純粋）

`extractDate(text, { now }) => { date: Date | null, spans: string[] }`。`docs/functional-design.md`「日付表現の対応範囲」の各行を実装。
- 相対語（今日/本日/明日/明後日・あさって/明々後日・しあさって）
- 「今週の◯曜(日)」「来週の◯曜(日)」「◯曜(日)」（単独は未来方向の直近）
- 「今週末」「週末」→ 直近の土曜
- 「◯月◯日」（過去日付なら翌年）、「◯日」（当月で過ぎていれば翌月）
- 該当なしは `date: null`（呼び出し側で選択日 or 実行日を補完）
- `spans` にマッチした部分文字列を返す（タイトル抽出で除去するため）

### `src/parser/rules/timeRules.js`（純粋）

`extractTime(text, { settings }) => { hour: number | null, minute: number, spans: string[] }`。
- 「◯時」「◯時◯分」「◯時半」（分省略時 `minute: 0`）
- 「午前◯時」（12→0）、「午後◯時」「夕方◯時」「夜◯時」（+12、12→12）
- 「朝/昼/夕方/夜」→ `settings` の対応する時
- 該当なしは `hour: null`

### `src/parser/rules/durationRules.js`（純粋）

`extractDuration(text, { startHour }) => { endHour?: number, endMinute?: number, durationMinutes?: number, allDay?: boolean, spans: string[] }`。
- 「◯時から△時(まで)」→ `endHour/endMinute`
- 「◯時間」「◯時間半」「◯分」→ `durationMinutes`
- 「終日」「一日」「丸一日」→ `allDay: true`

### `src/parser/dateTimeParser.js`（純粋、オーケストレーション）

```
parseDateTime(rawText, { now, settings }) => ParsedDateTime
```
手順:
1. `text = normalize(rawText)`
2. `d = extractDate(text, { now })`、`t = extractTime(text, { settings })`、`dur = extractDuration(text, {...})`
3. 基準日 = `d.date ?? null`。時刻 = `t.hour`。
   - 日付・時刻ともに無し → `startAt/endAt` を返さず `title` 抽出のみ
   - 日付あり・時刻無し → `allDay` の指定があれば終日、なければ `startAt` は返さず（フォームで時刻入力を促す）日付だけフォーム初期値へ（`ParsedDateTime` には別途 `dateOnly?: string` を持たせる）
   - 日付あり・時刻あり → `startAt` を組み立て
4. `endAt` = 範囲指定 or `startAt + durationMinutes` or `startAt + defaultDurationMinutes`
5. タイトル = `text` から `d.spans / t.spans / dur.spans` を除去し、前後の助詞（に/から/まで/の/は/で）と記号をトリム
6. 複数候補が出た表現は、元テキストで先頭に近いものを採用

### `src/store/db.js`

`getDB()` が `idb.openDB('koekare', 1, { upgrade })` の結果をシングルトンで返す。`upgrade` で `events`（keyPath `id`、index `by_start`）と `settings`（keyPath `key`）を作成。

### `src/store/eventStore.js`

| 関数 | 内容 |
|---|---|
| `add(input, ctx)` | `createEvent` → `db.put('events', event)` → 返す |
| `update(id, changes)` | `get` → `applyChanges` → `put` |
| `remove(id)` | `db.delete('events', id)` |
| `get(id)` | `db.get('events', id)` |
| `list({ from, to })` | `from/to` あり: `by_start` の `IDBKeyRange.bound(fromISO, toISO, false, true)`。無し: `getAll`、`startAt` 昇順 |
| `bulkPut(events)` | 単一トランザクションで全件 `put`（読み込み用） |

### `src/store/settingsStore.js`

`get() => Settings`（無ければ既定）、`update(partial)`。

### `src/store/backup.js`（`bulkPut` 以外は純粋に近い）

| 関数 | 内容 |
|---|---|
| `buildBackup(events) => object` | `schemaVersion: 1`、`app: 'koekare'`、`exportedAt`、`events`（`key` 除去、`startAt` 昇順） |
| `toDownload(backup) => { blob, filename }` | `filename = 'koekare-backup-YYYYMMDD.json'` |
| `parseBackup(text) => Event[]` | JSON パース＋検証。失敗時 `BackupError`（日本語メッセージ）。検証: `app==='koekare'`、`schemaVersion===1`、`events` 配列、各要素の必須項目・型・`endAt>=startAt` |
| `importEvents(text, { mode = 'merge' }) => { imported: number }` | `parseBackup` → `eventStore.bulkPut`。`mode='merge'` は同一 `id` を読み込み側で上書き。検証失敗時は書き込みゼロ |

### `src/speech/speechRecognizer.js`

```
createSpeechRecognizer({ RecognitionCtor } = {}) => {
  supported: boolean,
  start(): void,     // onError('offline') if navigator.onLine === false
  stop(): void,
  onResult: (transcript, { isFinal }) => void,
  onError: (code) => void,   // 'permission' | 'no-speech' | 'network' | 'offline' | 'unknown'
  onEnd: () => void,
}
```
- `RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition`（テストで差し替え可能に引数化）
- 設定: `lang='ja-JP'`、`interimResults=true`、`continuous=false`、`maxAlternatives=1`
- ネイティブの `error` イベントの `error` 値を上記コードへマッピング

### `src/components/`

- `MicButton({ disabled, onStart })` — 🎤、`aria-label='音声で予定を追加'`
- `DateField({ value, onChange })` — `<input type="date">` ラッパー、表示は曜日付き
- `TimeField({ value, onChange, disabled })` — `<input type="time">` ラッパー
- `EventListItem({ event, onClick })` — 時刻＋タイトル（終日は「終日」表記）

### `src/views/`

| コンポーネント | 主な props | 役割 |
|---|---|---|
| `App` | — | `view`（`day`/`month`/`form`/`backup`）、`selectedDate`、`draft`、`recognizing` を保持し画面を出し分け。`VoiceOverlay` は `day` の上にモーダル表示 |
| `DayView` | `date, events, onPrevDay, onNextDay, onOpenMonth, onOpenMenu, onNewEvent, onEditEvent, onStartVoice` | 選択日の予定を時系列表示。フッターに ＋ / 🎤 |
| `MonthView` | `month, daysWithEvents, onPrevMonth, onNextMonth, onSelectDate` | 月グリッド、予定のある日にマーク |
| `EventForm` | `initial, selectedDate, onSaved, onDeleted, onCancel` | `initial` が `ParsedDateTime` なら新規、`Event` なら編集。フィールド: タイトル / 日付 / 終日 / 開始 / 終了。保存時 `validateEvent`、失敗はフィールド近傍にメッセージ。編集時のみ削除ボタン（確認プロンプト） |
| `VoiceOverlay` | `onParsed(parsed), onCancel` | `createSpeechRecognizer` を使用。認識中は暫定テキスト表示、確定で `parseDateTime` → `onParsed`。エラー/無音時はメッセージを出し「手入力する」ボタンで空フォームへ誘導 |
| `BackupMenu` | `onClose` | 「書き出し」＝ `buildBackup`→`toDownload`→`<a download>` クリック。「読み込み」＝ `<input type="file">`→`importEvents`→結果 or エラー表示。`onClose` で日別へ |

### `src/hooks/useEvents.js`

`useEvents({ from, to })` → `{ events, loading, error, reload }`。`from/to` 変更で再取得。追加・更新・削除は呼び出し側でストアを叩いてから `reload()`。

## 画面遷移と状態（`App.jsx`）

```
view: 'day' | 'month' | 'form' | 'backup'
selectedDate: Date            // 日別ビューの対象日
draft: ParsedDateTime | Event | null   // form へ渡す初期値
recognizing: boolean          // VoiceOverlay 表示中

マイクボタン → recognizing=true（VoiceOverlay 表示）
  onParsed(parsed) → draft=parsed, view='form', recognizing=false
  onCancel → recognizing=false
＋ボタン → draft={ transcript:'' 相当の空 }, view='form'
予定タップ → draft=event, view='form'
form の onSaved/onDeleted/onCancel → view='day'（該当日を表示）, draft=null
```

## ビルド・配信設定

- `vite.config.js`: `@vitejs/plugin-react`、`vite-plugin-pwa`（`registerType: 'autoUpdate'`、`manifest`: `name/short_name='コエカレ'`（内部識別は `koekare`）、`display: 'standalone'`、`lang: 'ja'`、`theme_color`、`background_color`、`icons` 192/512＋maskable）、`base: '/claude-code-book-template/'`（GitHub Pages プロジェクトサイト用。リポジトリ名変更時に要更新）
- `index.html`: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`、`<link rel="apple-touch-icon" ...>`、`<meta name="apple-mobile-web-app-capable" content="yes">`、`<meta name="apple-mobile-web-app-status-bar-style" content="default">`
- `src/main.jsx`: ルートマウント＋ `navigator.storage?.persist()` を初回に一度要求
- `.github/workflows/deploy.yml`: `on: push: branches: [main]` → Node 22 → `npm ci` → `npm run lint` → `npm test` → `npm run build` → `actions/upload-pages-artifact`（`dist`）→ `actions/deploy-pages`

## テスト設計

- `vitest.config.js`: `environment: 'jsdom'`、`setupFiles: ['./vitest.setup.js']`
- `vitest.setup.js`: `import 'fake-indexeddb/auto'`、`@testing-library/jest-dom` 拡張、各テスト後に IndexedDB を破棄するヘルパー
- **パーサー**（最重要 / `src/parser/**/*.test.js`）: `now = new Date('2026-08-29T09:00:00+09:00')` 固定。`docs/functional-design.md` の3表の各行 + 境界（「◯月◯日」過去→翌年、「◯日」経過→翌月、「23時」そのまま、「午後12時」=12:00、「午前12時」=0:00、時刻なしで `startAt` を返さない、タイトル空で `title` を返さない）
- **ストア**（`src/store/**/*.test.js`）: `fake-indexeddb` で add/update/remove/get、`list` の範囲検索、`update` で `updatedAt` 更新、`importEvents` の検証失敗（`app` 不一致・`schemaVersion` 違い・`endAt<startAt`）時に既存レコードが不変
- **ドメイン**（`src/domain/**/*.test.js`）: `validateEvent` の各分岐、`createEvent` の `endAt` 補完
- **コンポーネント**（`src/views/**/*.test.jsx`）: `EventForm` — タイトル未入力で `onSaved` が呼ばれない / 推測値の初期表示 / 削除確認。`VoiceOverlay` — モックした `SpeechRecognizer` の `onError('offline')` でメッセージと手入力導線が出る
- **音声**（`src/speech/*.test.js`）: 偽 `RecognitionCtor` を注入し、`onResult` 発火 → コールバック、`error='not-allowed'` → `'permission'` マッピング、`navigator.onLine=false` で `start()` が `onError('offline')`

## 影響範囲の分析

- **既存アプリコードへの影響**: なし（旧プロジェクト削除済み、アプリコードはゼロから作成）
- **`docs/` への影響**: なし（本ステアリング作成前に6本確定済み）。ただし下記「恒久ドキュメントへの反映」の項目は実装確定時に追記が必要
- **リポジトリ直下に新規作成するファイル**: `index.html`、`package.json`、`package-lock.json`、`vite.config.js`、`vitest.config.js`、`vitest.setup.js`、`.oxlintrc.json`、`.gitignore`、`.github/workflows/deploy.yml`、`README.md`（現状ほぼ空のため全面作成）、`public/`、`src/`
- **`CLAUDE.md`**: 冒頭「本リポジトリは、タスク管理アプリケーション専用のリポジトリです」が旧内容。プロジェクト指示ファイルのため本作業では変更せず、別途ユーザー確認のうえ更新する（本作業のスコープ外）
- **`.devcontainer/` ・ `.vscode/` ・ `.mcp.json`**: 変更しない
- **デプロイ環境**: GitHub Pages を有効化する必要がある（リポジトリ設定。手作業が1回必要）。Pages のビルドソースを「GitHub Actions」に設定する

## 恒久ドキュメントへの反映（実装確定時に追記するもの）

- `docs/functional-design.md`: 読み込み時の重複ポリシー（今回 `merge` = id 一致は読み込み側で上書き、に確定）を追記
- `docs/repository-structure.md`: `src/hooks/`（`useEvents.js`）を構成図に追加、`vitest.setup.js` の追加
- `docs/architecture.md`: `base` パス（`/claude-code-book-template/`）と GitHub Pages の設定手順、`fake-indexeddb` をテスト依存に追加
- いずれも実装で確定した時点で更新し、コミットを分ける（`docs:` プレフィックス）

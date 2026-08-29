# 開発ガイドライン

本書は `docs/architecture.md`（技術スタック）・`docs/repository-structure.md`（フォルダ構成）を前提に、コエカレのコーディング規約を定義する。ここに定めるルールは、レビュー時に機械的に判定できる具体性を持たせることを目的とする。

## 命名規則

### ファイル名

- Reactコンポーネントは PascalCase + `.jsx`: `DayView.jsx`、`MicButton.jsx`、`EventForm.jsx`
- コンポーネント以外のJSモジュールは camelCase + `.js`: `eventStore.js`、`dateTimeParser.js`、`speechRecognizer.js`
- カスタムフック（使う場合）は `use` で始める camelCase + `.js`: `useEvents.js`
- テストファイルは対象ファイル名 + `.test.js` / `.test.jsx`、対象と同じディレクトリに置く: `dateTimeParser.js` → `dateTimeParser.test.js`
- コンポーネント固有のスタイルは対象と同名 + `.css`: `DayView.jsx` → `DayView.css`

### 変数・関数名

- 変数・関数は camelCase: `defaultDurationMinutes`、`parseDateTime()`
- モジュールレベルの定数は UPPER_SNAKE_CASE: `const DEFAULT_DURATION_MINUTES = 60`
- 真偽値を返す関数・変数は `is` / `has` で始める: `isAllDay(event)`、`hasValidRange(start, end)`
- Reactコンポーネント関数は PascalCase: `function DayView() { ... }`
- イベントハンドラの prop は `on` + 動詞、内部ハンドラは `handle` + 対象: `onSave` / `handleSaveClick`

### CSSクラス名

- ケバブケースとし、コンポーネント名を接頭辞にして衝突を避ける（プレーンCSSでスコープがないため）: `.day-view`、`.day-view__list`、`.day-view__item--selected`
- 色・余白・フォントサイズなどのテーマ値は `src/styles/global.css` のCSSカスタムプロパティ（`--color-*`、`--space-*` 等）を使い、コンポーネントCSSに数値を直書きしない

### データ・ストレージ上の名前

- IndexedDBのデータベース名・オブジェクトストア名・インデックス名はスネークケース: DB `koekare`、ストア `events` / `settings`、インデックス `by_start`
- `Event` / `Settings` オブジェクトのフィールドは camelCase（`startAt`、`endAt`、`allDay`、`defaultDurationMinutes`）。書き出しJSONのフィールドもこれに一致させる（`docs/glossary.md` の対応表を正とする）

### 日本語・英語の使い分け

- コード上の識別子（変数名・関数名・ファイル名・CSSクラス名）はすべて英語
- 画面に表示する文言・エラーメッセージ・`aria-label` はすべて日本語（`docs/product-requirements.md` のスコープ要件に対応）
- 表示文言はコンポーネント内に直書きせず、`src/` 直下の文言モジュール（例: `messages.js`）または各コンポーネント先頭の定数にまとめ、将来の文言調整・多言語化に備える
- ドメイン用語の英日対応は `docs/glossary.md` を正とする

## スタイリング規約（コード）

- モジュール形式はESM統一（`import` / `export` のみ、`require` は使わない）
- セミコロンなし、シングルクォート、インデント2スペース
- Lintは `oxlint` を使用し、設定はリポジトリルートの `.oxlintrc.json` に置く。`npm run lint` で実行する
- 非同期処理は `async` / `await` を使い、`.then()` チェーンは使わない
- マジックナンバーを直接埋め込まず、意味のある定数名を付ける（既定の予定長さ `60` は `src/domain/settings.js` の `DEFAULT_DURATION_MINUTES` として定義する）
- 1ファイル1責務・1コンポーネント1ファイルを原則とする
- Reactは関数コンポーネントとフックのみ使う（クラスコンポーネント禁止）。propsは引数で分割代入する

```jsx
// src/components/MicButton.jsx の例
export function MicButton({ disabled, onStart }) {
  return (
    <button
      type="button"
      className="mic-button"
      aria-label="音声で予定を追加"
      disabled={disabled}
      onClick={onStart}
    >
      🎤
    </button>
  )
}
```

- 副作用（IndexedDBアクセス、音声認識、`navigator.storage`）はコンポーネントに直書きせず、`src/store/` ・ `src/speech/` の関数、または専用フック経由で呼ぶ
- `src/domain/` と `src/parser/` はブラウザAPI・Reactに依存しない純粋関数に保つ（テストしやすくするため）
- 日時は内部的にISO 8601文字列またはDateで持ち、表示整形は必ず `src/datetime.js` のヘルパーを通す（フォーマットのばらつき防止）

## スタイリング規約（UI・アクセシビリティ）

- 操作要素は適切な要素を使う（ボタンは `<button type="button">`、リンクは `<a>`）。`div` のクリックハンドラで代用しない
- フォーム項目には `<label>` を関連付ける。アイコンのみのボタンには `aria-label` を付ける
- タップ領域は最小 44×44px を確保する（`--tap-min: 44px` を利用）
- レイアウトはモバイルファースト。ノッチ・ホームバーを避けるため `env(safe-area-inset-*)` を使う
- 色のコントラストはWCAG AA相当（本文4.5:1以上）を目安にする
- 音声認識が使えない環境（PC等）では、マイクボタンを `disabled` にし、理由をツールチップまたは近接テキストで示す

## テスト規約

- テストフレームワークは Vitest。`describe` / `it` を使う。環境は jsdom（`vitest.config.js`）
- テストファイルは対象と同じディレクトリに co-locate する（`docs/repository-structure.md` の配置ルール）
- `it` の説明文は日本語で書き、`docs/product-requirements.md` の受け入れ条件・`docs/functional-design.md` の対応表と対応付けられるようにする

```js
describe('dateTimeParser', () => {
  it('「明日の15時から会議」を翌日15:00開始・タイトル「会議」に推測する', () => {
    const now = new Date('2026-08-29T09:00:00+09:00')
    const result = parseDateTime('明日の15時から会議', { now, settings: defaultSettings })
    // ...
  })
})
```

- 必須テスト対象:
  - **日時推測パーサー（最重要）**: `docs/functional-design.md` の日付・時刻・期間の対応表の各行を、`now` を固定してケース化する。境界（`◯月◯日` が過去日 → 翌年、`◯日` が過ぎている → 翌月、`23時` はそのまま、`午後12時` = 12:00）を含める。日時が取れない入力で `startAt` を返さないことも確認する
  - **予定ストア**: `fake-indexeddb` を使い、add / update / delete / get / list（範囲検索）、`updatedAt` の更新、読み込みJSONの検証失敗時に既存データが変更されないこと
  - **ドメイン**: `event.js` のバリデーション（タイトル空で不可、`endAt < startAt` で不可、`allDay` 時の扱い）
  - **予定確認フォーム**: `@testing-library/react` でタイトル未入力なら保存ボタンで保存されない、推測値が初期表示される、削除に確認プロンプトが出る
- 音声認識は `SpeechRecognizer` インターフェースをモックに差し替えてテストし、実マイク・実ネットワークに依存させない
- ブラウザ依存API（`navigator.storage`、`SpeechRecognition`）はテストでスタブ化する
- カバレッジの数値目標はMVPでは設けないが、`src/parser/` ・ `src/domain/` ・ `src/store/` はすべての公開関数に最低1ケースを用意する

## Git規約

- コミットメッセージはConventional Commits形式のプレフィックスを付ける: `feat:`、`fix:`、`docs:`、`test:`、`refactor:`、`chore:`、`style:`（プレフィックスは英語、本文は日本語可）
  - 例: `feat: 日時推測パーサーに「今週末」を追加`
- ブランチ名は `feature/<概要>` ・ `fix/<概要>` のケバブケース英語表記（例: `feature/voice-overlay`）
- 1コミットは1つの論理的な変更に留める（複数画面の追加をまとめて1コミットにしない）
- コミット前に `npm run lint` と `npm test` がグリーンであることを確認する
- `dist/` ・ `node_modules/` ・ ローカル生成物はコミットしない（`.gitignore` で除外）
- `main` へ直接pushせず、ブランチ → PR（またはローカルでのレビュー）を経てマージする。マージ時に GitHub Actions がビルドとデプロイを行う

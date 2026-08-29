# 初回実装 タスクリスト

`design.md` の設計に沿って実装する。進捗は各タスクのチェックボックスで管理する（`[ ]` 未着手 / `[~]` 作業中 / `[x]` 完了）。各段階の終わりに「段階の完了条件」を満たすことを確認してからコミットする。

コミットは段階ごと・論理単位ごとに分ける（`docs/development-guidelines.md` Git規約）。各コミット前に `npm run lint` と `npm test` がグリーンであること。

---

## 段階1: プロジェクトの土台

- [ ] `npm create vite@latest`（React / JavaScript）相当の構成をリポジトリ直下に作成（`package.json`、`index.html`、`src/main.jsx`、`src/App.jsx`）
- [ ] 依存追加: `react` `react-dom` / `date-fns` / `idb` / dev: `vite` `@vitejs/plugin-react` `vite-plugin-pwa` `vitest` `@testing-library/react` `@testing-library/user-event` `@testing-library/jest-dom` `jsdom` `fake-indexeddb` `oxlint`
- [ ] `vite.config.js`: React プラグイン、`base: '/claude-code-book-template/'`（1か所に定数化してコメントで明示）、`vite-plugin-pwa` の雛形
- [ ] `vitest.config.js` / `vitest.setup.js`（jsdom、`fake-indexeddb/auto`、`jest-dom`）
- [ ] `.oxlintrc.json`（セミコロンなし・シングルクォート・2スペース）、`package.json` に `dev` / `build` / `preview` / `test` / `lint` スクリプト
- [ ] `.gitignore`（`node_modules/`、`dist/`、`*.local`）
- [ ] `index.html`: iOS向けメタ（`viewport-fit=cover`、`apple-mobile-web-app-capable`、`apple-touch-icon` 参照）、`<div id="root">`
- [ ] `src/App.jsx`: 「日別ビュー」のプレースホルダを表示するだけの初期版
- [ ] `src/styles/global.css`: リセット、CSSカスタムプロパティ（`--color-*` `--space-*` `--tap-min: 44px`）、safe-area 余白

**段階の完了条件**: `npm run dev` で空の画面が表示される / `npm run build` 成功 / `npm test`（0件でも可）と `npm run lint` がグリーン。

---

## 段階2: データ層（ドメイン + ストレージ）

- [ ] `src/domain/settings.js`: `DEFAULT_SETTINGS`、`DEFAULT_DURATION_MINUTES` 等の定数、`withDefaults()`
- [ ] `src/datetime.js`: `toISO` / `fromISO` / `startOfDayLocal` / `addDays` / `addMinutes` / `setTime` / `formatDayHeader` / `formatTime` / `formatMonthTitle` / `getWeekday` / `nextOccurrenceOfWeekday` / `upcomingSaturday`
- [ ] `src/domain/event.js`: `createEvent` / `applyChanges` / `validateEvent`
- [ ] `src/domain/event.test.js`: `validateEvent` の各分岐、`createEvent` の `endAt` 補完、`allDay` の日境界
- [ ] `src/store/db.js`: `getDB()`（`openDB('koekare', 1, { upgrade })`、`events`＋`by_start`、`settings`）
- [ ] `src/store/eventStore.js`: `add` / `update` / `remove` / `get` / `list({from,to})` / `bulkPut`
- [ ] `src/store/settingsStore.js`: `get` / `update`
- [ ] `src/store/eventStore.test.js`: CRUD、`list` の範囲検索、`update` の `updatedAt` 更新（`fake-indexeddb`）

**段階の完了条件**: データ層のテストがグリーン / ドメイン関数はブラウザAPI非依存。

---

## 段階3: 表示（日別・月別ビュー）

- [ ] `src/hooks/useEvents.js`: `{ events, loading, error, reload }`、`from/to` 変更で再取得
- [ ] `src/components/EventListItem.jsx` ＋ CSS
- [ ] `src/views/DayView.jsx` ＋ CSS: 日移動、予定の時系列表示、フッターの ＋ / 🎤（この段階ではハンドラは仮）
- [ ] `src/views/MonthView.jsx` ＋ CSS: 月グリッド、予定のある日にマーク、日タップで日別へ
- [ ] `src/App.jsx`: `view`（`day` / `month`）と `selectedDate` の状態、両ビューの切り替え
- [ ] `src/views/DayView.test.jsx`: 指定日の予定だけが表示される（`useEvents` はストア経由 or モック）

**段階の完了条件**: 手動でDBに入れた予定が日別・月別に正しい日付で表示され、日/月の移動と相互遷移ができる。

---

## 段階4: 手入力フロー（予定確認フォーム）

- [ ] `src/components/DateField.jsx` / `src/components/TimeField.jsx` ＋ CSS
- [ ] `src/views/EventForm.jsx` ＋ CSS: `initial` が `ParsedDateTime`（新規）/ `Event`（編集）の両対応、フィールド（タイトル / 日付 / 終日 / 開始 / 終了）、`validateEvent` 表示、保存で `eventStore.add|update`、編集時のみ削除（確認プロンプト）
- [ ] `src/App.jsx`: `draft` 状態、＋ボタン→空フォーム、予定タップ→編集フォーム、保存/削除/キャンセル→日別へ戻る
- [ ] `src/views/EventForm.test.jsx`: タイトル未入力で保存されない / `endAt < startAt` で保存されない / 編集時に既存値が初期表示 / 削除確認

**段階の完了条件**: `docs/product-requirements.md` 受け入れ条件のうち「手入力での予定CRUD」「日別・月別への反映」「再起動後もデータが残る」を満たす。

---

## 段階5: 日時推測エンジン

- [ ] `src/parser/normalize.js` ＋ テスト（全角→半角、漢数字0〜59、空白圧縮）
- [ ] `src/parser/rules/dateRules.js` ＋ テスト（`docs/functional-design.md`「日付表現の対応範囲」の全行 + 過去日→翌年 / 経過日→翌月）
- [ ] `src/parser/rules/timeRules.js` ＋ テスト（同「時刻・時間帯表現」の全行 + 午前/午後12時、23時）
- [ ] `src/parser/rules/durationRules.js` ＋ テスト（同「期間・時刻範囲」の全行）
- [ ] `src/parser/dateTimeParser.js` ＋ テスト: `now` 固定で結合ケース（「明日の15時から会議」「来週の月曜の朝に歯医者」「金曜10時から11時 打ち合わせ」「時刻なし→`startAt` を返さない」「タイトル空→`title` を返さない」）

**段階の完了条件**: パーサーのテストが対応表の各行を網羅し、グリーン。パーサーは React・ブラウザAPI非依存。

---

## 段階6: 音声入力

- [ ] `src/speech/speechRecognizer.js`: `createSpeechRecognizer({ RecognitionCtor })`、`lang='ja-JP'`、エラーコード正規化、`navigator.onLine=false` で `onError('offline')`
- [ ] `src/speech/speechRecognizer.test.js`: 偽 `RecognitionCtor` 注入、`onResult` 伝播、`not-allowed`→`permission`、オフライン時 `offline`
- [ ] `src/components/MicButton.jsx` ＋ CSS（`disabled` 対応、`aria-label`）
- [ ] `src/views/VoiceOverlay.jsx` ＋ CSS: 認識中の暫定テキスト表示、確定で `parseDateTime`→`onParsed`、エラー/無音で日本語メッセージ＋「手入力する」導線
- [ ] `src/App.jsx`: `recognizing` 状態、マイクボタン→オーバーレイ、`onParsed`→`draft` セットしてフォームへ、非対応環境ではマイクボタンを `disabled`
- [ ] `src/views/VoiceOverlay.test.jsx`: モック認識器で `onError('offline')` 時にメッセージと手入力導線が出る / 認識成功で推測値がフォームへ渡る

**段階の完了条件**: PC Chrome で音声→推測→フォームの一連が動く（実マイク）。認識失敗・許可拒否・オフラインのいずれでも手入力へ継続できる。

---

## 段階7: バックアップ（書き出し・読み込み）

- [ ] `src/store/backup.js`: `buildBackup` / `toDownload` / `parseBackup`（`BackupError`）/ `importEvents({mode:'merge'})`
- [ ] `src/store/backup.test.js`: 往復（書き出し→読み込みで一致）、検証失敗（`app` 不一致 / `schemaVersion` 違い / `endAt<startAt` / `events` 非配列）時に既存データ不変、`merge` の id 上書き
- [ ] `src/views/BackupMenu.jsx` ＋ CSS: 「書き出し」（`<a download>`）、「読み込み」（`<input type="file">`→結果 or エラー表示）
- [ ] `src/App.jsx`: `view='backup'`、日別ビューのメニューからの導線

**段階の完了条件**: 受け入れ条件「書き出しで全予定を含む1ファイル」「読み込みで復元」「壊れたファイルで既存データを上書きしない」を満たす。

---

## 段階8: PWA・配信

- [ ] `public/icons/`: 192 / 512 / maskable / `apple-touch-icon`（仮アイコンでよい。差し替え可能に）
- [ ] `vite.config.js` の `vite-plugin-pwa` マニフェスト確定（`name`/`short_name`、`display: standalone`、`lang: ja`、`theme_color`、`background_color`、`icons`、`registerType: 'autoUpdate'`）
- [ ] `src/main.jsx`: Service Worker 登録、初回に `navigator.storage?.persist()` を要求
- [ ] `src/App.jsx` or 専用コンポーネント: ストレージ永続化が拒否された場合に「定期的な書き出しを推奨」する控えめな案内
- [ ] `.github/workflows/deploy.yml`: `main` push で Node 22 → `npm ci` → `npm run lint` → `npm test` → `npm run build` → `actions/upload-pages-artifact`（`dist`）→ `actions/deploy-pages`
- [ ] `README.md`: 概要、`npm run dev` / `build` / `test` / `lint`、デプロイの仕組み、iPhone での「ホーム画面に追加」手順、データは端末内のみ・バックアップ推奨の注意
- [ ] （ユーザー作業）GitHub リポジトリ設定で Pages のソースを「GitHub Actions」に設定
- [ ] 実機確認: デプロイURLを iPhone Safari で開く →「ホーム画面に追加」→ アイコンから全画面起動 → 音声で1件登録 → アプリ終了・再起動で残存 → 機内モードで閲覧

**段階の完了条件**: `requirements.md`「受け入れ条件」の本作業固有項目をすべて満たす。

---

## 段階9: 仕上げ・ドキュメント反映

- [ ] `design.md`「恒久ドキュメントへの反映」の各項目を `docs/` に反映（`docs:` コミット）
  - `functional-design.md`: 読み込み重複ポリシー（`merge`）
  - `repository-structure.md`: `src/hooks/`、`vitest.setup.js`
  - `architecture.md`: `base` パスと GitHub Pages 設定手順、`fake-indexeddb`
- [ ] 全体のリファクタ確認（`docs/development-guidelines.md` の規約準拠、マジックナンバー、レイヤ分離）
- [ ] このタスクリストの全チェック完了を確認

**全体の完了条件**:
- `docs/product-requirements.md`「受け入れ条件」全項目 ＋ `requirements.md`「受け入れ条件」全項目を満たす
- `npm run lint` / `npm test` グリーン、`npm run build` 成功
- GitHub Pages に自動デプロイされ、iPhone 実機で音声登録まで確認済み

---

## 未確定事項（実装中に判断し、必要なら恒久ドキュメントへ）

- アプリ表示名（暫定「コエカレ」）。内部識別子 `koekare` は先行して使用
- 仮アイコンのデザイン（後日差し替え前提）
- リポジトリ名変更の有無（`base` パスに影響。変更時は `vite.config.js` の該当1行を修正）

# 初回実装 タスクリスト

`design.md` の設計に沿って実装する。進捗は各タスクのチェックボックスで管理する（`[ ]` 未着手 / `[~]` 作業中 / `[x]` 完了）。各段階の終わりに「段階の完了条件」を満たすことを確認してからコミットする。

コミットは段階ごと・論理単位ごとに分ける（`docs/development-guidelines.md` Git規約）。各コミット前に `npm run lint` と `npm test` がグリーンであること。

---

## 段階1: プロジェクトの土台 ✅

- [x] Vite（React / JavaScript）構成をリポジトリ直下に作成（`package.json`、`index.html`、`src/main.jsx`、`src/App.jsx`）
- [x] 依存追加: `react` `react-dom` / `date-fns` `idb` / dev: `vite` `@vitejs/plugin-react` `vite-plugin-pwa` `vitest` `@testing-library/react` `@testing-library/user-event` `@testing-library/jest-dom` `jsdom` `fake-indexeddb` `oxlint`
- [x] `vite.config.js`: React プラグイン、`BASE_PATH = '/claude-code-book-template/'`（定数＋コメント）、`vite-plugin-pwa` の雛形
- [x] `vitest.config.js` / `vitest.setup.js`（jsdom、`fake-indexeddb/auto`、`jest-dom`、`afterEach` で cleanup + DB破棄）
- [x] `.oxlintrc.json`（react / jsx-a11y プラグイン、`react-in-jsx-scope` 無効）、`package.json` に `dev` / `build` / `preview` / `test` / `test:watch` / `lint` スクリプト
- [x] `.gitignore`
- [x] `index.html`: iOS向けメタ（`viewport-fit=cover`、`apple-mobile-web-app-capable`、`apple-touch-icon` 参照）、`<div id="root">`
- [x] `src/App.jsx`: 画面切り替えの器（プレースホルダ表示）
- [x] `src/styles/global.css`: リセット、CSSカスタムプロパティ（`--color-*` `--space-*` `--tap-min: 44px`）、safe-area、ダークモード
- [x] `public/icons/`: 仮アイコン（192 / 512 / maskable / apple-touch-icon）

**段階の完了条件**: ✅ `npm run dev` で画面表示（ブラウザ確認済み、console エラーなし）/ `npm run build` 成功 / `npm test`・`npm run lint` グリーン。

---

## 段階2: データ層（ドメイン + ストレージ）✅

- [x] `src/domain/settings.js`: `DEFAULT_SETTINGS`、`DEFAULT_DURATION_MINUTES`、`withDefaults()`
- [x] `src/datetime.js`: ISO 整形・曜日計算・月グリッド等の date-fns ラッパー
- [x] `src/domain/event.js`: `createEvent` / `applyChanges` / `validateEvent` / `ValidationError`
- [x] `src/domain/event.test.js`: `validateEvent` の各分岐、`endAt` 補完、`allDay` 日境界、不変項目
- [x] `src/store/db.js`: `getDB()`（`koekare`、`events`＋`by_start`、`settings`）、`closeDB()`
- [x] `src/store/eventStore.js`: `add` / `update` / `remove` / `get` / `list({from,to})` / `bulkPut`
- [x] `src/store/settingsStore.js`: `getSettings` / `updateSettings`
- [x] `src/store/eventStore.test.js`: CRUD、範囲検索、`updatedAt` 更新（`fake-indexeddb`）

**段階の完了条件**: ✅ テストグリーン / `domain` はブラウザAPI非依存。

---

## 段階3: 表示（日別・月別ビュー）✅

- [x] `src/hooks/useEvents.js`: `{ events, loading, error, reload }`、`from/to` 変更で再取得
- [x] `src/components/EventListItem.jsx` ＋ CSS
- [x] `src/views/DayView.jsx` ＋ CSS: 日移動、予定の時系列表示、フッターの ＋ / 🎤
- [x] `src/views/MonthView.jsx` ＋ CSS: 月グリッド、予定のある日にマーク、日タップで日別へ
- [x] `src/App.jsx`: `view`（`day` / `month`）と `selectedDate` の状態、両ビューの切り替え
- [x] `src/views/DayView.test.jsx`: 予定表示・空状態・終日表記・タップ・音声無効

**段階の完了条件**: ✅ ブラウザで日別・月別の表示と相互遷移を確認。

---

## 段階4: 手入力フロー（予定確認フォーム）✅

- [x] `src/components/DateField.jsx` / `src/components/TimeField.jsx` ＋ CSS
- [x] `src/views/EventForm.jsx` ＋ CSS: 新規/編集両対応、タイトル/日付/終日/開始/終了、
  バリデーション表示、2段階の削除確認、音声下書きの聞き取り内容表示
- [x] `src/App.jsx`: `draft` 状態、＋ボタン/予定タップ→フォーム、保存後に該当日を表示
- [x] `src/views/EventForm.test.jsx`: 9件（未入力・範囲・編集・削除・音声下書き）

**段階の完了条件**: ✅ ブラウザで作成→表示→削除を確認。再起動後もデータ保持（IndexedDB）。

---

## 段階5: 日時推測エンジン ✅

- [x] `src/parser/normalize.js` ＋ テスト（全角→半角、漢数字0〜99、空白圧縮）
- [x] `src/parser/rules/dateRules.js` ＋ テスト（対応表の全行 + 過去日→翌年 / 経過日→翌月）
- [x] `src/parser/rules/timeRules.js` ＋ テスト（全行 + 午前/午後12時、23時）
- [x] `src/parser/rules/durationRules.js` ＋ テスト（全行）
- [x] `src/parser/dateTimeParser.js` ＋ テスト: `now` 固定の結合ケース9件（時刻なし→`startAt` なし、
  タイトル空→`title` なし、漢数字入力 を含む）

**段階の完了条件**: ✅ 36件グリーン。対応表の各行を網羅。parser は React・ブラウザAPI非依存。

---

## 段階6: 音声入力 ✅

- [x] `src/speech/speechRecognizer.js`: `createSpeechRecognizer({ RecognitionCtor })`、`ja-JP`、
  エラー正規化、`navigator.onLine=false` で `onError('offline')`、`isSpeechSupported()`
- [x] `src/speech/speechRecognizer.test.js`: 7件（注入・伝播・マッピング・offline）
- [x] `src/components/MicButton.jsx` ＋ CSS（`disabled`・`aria-label`）
- [x] `src/views/VoiceOverlay.jsx` ＋ CSS: 暫定テキスト表示、確定で `parseDateTime`→`onParsed`、
  エラー/無音で日本語メッセージ＋「手入力する」導線
- [x] `src/App.jsx`: `recognizing` 状態、非対応環境はマイクボタン無効
- [x] `src/views/VoiceOverlay.test.jsx`: 4件（offline導線 / 認識成功 / 途中経過 / キャンセル）

**段階の完了条件**: ✅ ブラウザで確認。マイク不許可でも「手入力する」で継続でき、行き止まりなし。

---

## 段階7: バックアップ（書き出し・読み込み）✅

- [x] `src/store/backup.js`: `buildBackup` / `toDownload` / `parseBackup`（`BackupError`）/ `importEvents`（merge）
- [x] `src/store/backup.test.js`: 9件（往復一致、各種検証失敗で既存データ不変、id 上書き）
- [x] `src/views/BackupMenu.jsx` ＋ CSS: 書き出し（`<a download>`）、読み込み（`<input type="file">`）
- [x] `src/App.jsx`: `view='backup'`、メニュー導線

**段階の完了条件**: ✅ ブラウザでメニュー表示・遷移を確認。壊れたファイルは既存データを上書きしない（テスト済）。

---

## 段階8: PWA・配信 ✅（一部ユーザー作業が残る）

- [x] `public/icons/`: 192 / 512 / maskable / `apple-touch-icon`（仮アイコン。差し替え前提）
- [x] `vite.config.js` の `vite-plugin-pwa` マニフェスト（`name`/`short_name`、`standalone`、`lang: ja`、
  `theme_color`、`background_color`、`icons`、`registerType: 'autoUpdate'`）
- [x] `src/main.jsx`: Service Worker 登録、初回に `navigator.storage?.persist()` を要求
- [x] `src/components/StorageNotice.jsx`: 未永続化時にバックアップを促す控えめな案内
- [x] `.github/workflows/deploy.yml`: `main` push で lint → test → build → GitHub Pages
- [x] `README.md`: 概要・コマンド・デプロイ・ホーム画面追加・データの扱い
- [ ] **（ユーザー作業）** GitHub の Settings → Pages → Source を「GitHub Actions」に設定
- [ ] **（ユーザー作業）** 実機確認: デプロイURLを iPhone Safari で開く →「ホーム画面に追加」→
  全画面起動 → 音声で1件登録 → 再起動で残存 → 機内モードで閲覧

**段階の完了条件**: ローカルでは達成（build/SW/オフライン起動）。実機での最終確認はデプロイ後にユーザーが実施。

---

## 段階9: 仕上げ・ドキュメント反映 ✅

- [x] `docs/` へ反映（`docs:` コミット）
  - `functional-design.md`: 読み込み重複ポリシー（merge に確定）
  - `repository-structure.md`: `src/hooks/`、`src/components/StorageNotice.jsx`
  - `architecture.md`: `BASE_PATH`、GitHub Pages 設定手順、`fake-indexeddb`、テスト環境方針、Vite v8
- [x] リファクタ確認（レイヤ分離：`domain`/`parser` はブラウザAPI非依存、マジックナンバーは定数化）
- [x] タスクリストの更新

**全体の完了条件**:
- [x] `npm run lint` / `npm test`（89件）グリーン、`npm run build` 成功
- [x] ブラウザで主要フロー（音声→手入力フォールバック、手入力CRUD、日別/月別、バックアップ画面）を確認
- [ ] **（ユーザー作業）** GitHub Pages 有効化 → 自動デプロイ → iPhone 実機で音声登録まで確認

---

## 未確定事項（実装中に判断し、必要なら恒久ドキュメントへ）

- アプリ表示名（暫定「コエカレ」）。内部識別子 `koekare` は先行して使用
- 仮アイコンのデザイン（後日差し替え前提）
- リポジトリ名変更の有無（`base` パスに影響。変更時は `vite.config.js` の該当1行を修正）

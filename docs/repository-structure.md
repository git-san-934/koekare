# リポジトリ構造定義書

本書は `docs/architecture.md` で確定した技術スタック（React + Vite + IndexedDB(`idb`) + Web Speech API + `vite-plugin-pwa`）を前提に、コエカレのフォルダ・ファイル構成を定義する。本書はコード実装開始前（`.steering/` の実装作業前）時点でのスナップショットである。

## 全体構成（リポジトリルート）

旧プロジェクト（`task-manager/`・`devtask/`）は削除済みで、本リポジトリはコエカレ専用の単一アプリ構成とする。アプリ本体はリポジトリ直下に置き、GitHub Pagesへの静的デプロイを単純化する。

```
koekare/                          # GitHub リポジトリ名（ローカルの作業フォルダ名は別でも可）
├── docs/                          # 恒久的ドキュメント（本書もここに含まれる）
│   ├── product-requirements.md
│   ├── functional-design.md
│   ├── architecture.md
│   ├── repository-structure.md
│   ├── development-guidelines.md
│   └── glossary.md
├── .steering/                     # 作業単位のステアリングファイル
│   └── [YYYYMMDD]-[開発タイトル]/
│       ├── requirements.md
│       ├── design.md
│       └── tasklist.md
├── .github/
│   └── workflows/
│       └── deploy.yml             # main への push で build → GitHub Pages へ公開
├── public/                        # そのまま dist/ へコピーされる静的アセット
│   ├── icons/                     # PWAアイコン（192/512、maskable）、apple-touch-icon
│   └── robots.txt
├── src/
│   ├── main.jsx                   # エントリ。React マウント、Service Worker 登録
│   ├── App.jsx                    # 画面切り替え（view state: day / month / form / backup）
│   ├── views/                     # 画面単位コンポーネント（docs/functional-design.md の画面一覧に対応）
│   │   ├── DayView.jsx            # 日別ビュー（ホーム）
│   │   ├── MonthView.jsx          # 月別ビュー
│   │   ├── AllEventsView.jsx      # すべての予定を日付ごとに箇条書き表示
│   │   ├── EventForm.jsx          # 予定確認フォーム（新規・編集・削除）
│   │   ├── VoiceOverlay.jsx       # 音声入力オーバーレイ
│   │   └── BackupMenu.jsx         # メニュー / 書き出し・読み込み
│   ├── components/                # 画面をまたいで使う小さな部品
│   │   ├── MicButton.jsx
│   │   ├── DateField.jsx
│   │   ├── TimeField.jsx
│   │   ├── EventListItem.jsx
│   │   └── StorageNotice.jsx      # ストレージ未永続化時のバックアップ案内
│   ├── hooks/
│   │   └── useEvents.js           # 指定範囲の予定を読み込むフック
│   ├── speech/
│   │   └── speechRecognizer.js    # SpeechRecognizer インターフェース + Web Speech API 実装
│   ├── parser/
│   │   ├── dateTimeParser.js      # parse(text, { now, settings }) => { startAt?, endAt?, title? }
│   │   ├── normalize.js           # 全角→半角、余分な空白除去
│   │   └── rules/
│   │       ├── dateRules.js       # 日付表現（今日 / 明日 / 来週の◯曜 / ◯月◯日 …）
│   │       ├── timeRules.js       # 時刻・時間帯表現（◯時 / ◯時半 / 午後◯時 / 朝 …）
│   │       └── durationRules.js   # 期間・時刻範囲（◯時から△時 / ◯時間 / 終日）
│   ├── store/
│   │   ├── db.js                  # idb openDB、オブジェクトストア定義、onupgradeneeded
│   │   ├── eventStore.js          # Event の add / update / delete / get / list
│   │   ├── settingsStore.js       # Settings の get / update（単一レコード）
│   │   └── backup.js              # 書き出し（JSON生成）・読み込み（検証 + 一括反映）
│   ├── domain/
│   │   ├── event.js               # Event の生成・バリデーション（title 必須、endAt >= startAt）
│   │   └── settings.js            # Settings の既定値（defaultDurationMinutes 等）
│   ├── datetime.js                # date-fns ベースの日本語表示フォーマット・曜日計算ヘルパー
│   └── styles/
│       ├── global.css            # リセット、CSSカスタムプロパティ（テーマ値）、safe-area
│       └── *.css                 # コンポーネント単位のスタイル（対応する .jsx と同名）
├── src/**/*.test.js(x)           # テストは対象ファイルと同じ場所に co-locate（下記ルール参照）
├── index.html                    # Vite エントリ。<div id="root">、viewport-fit=cover、apple-touch-icon、manifest link
├── vite.config.js                # @vitejs/plugin-react、vite-plugin-pwa（マニフェスト・precache 設定）
├── vitest.config.js              # jsdom 環境、setup ファイル（fake-indexeddb 等）
├── vitest.setup.js               # テスト共通セットアップ
├── package.json
├── .oxlintrc.json                # Lint 設定（docs/development-guidelines.md の規約に対応）
├── .gitignore                    # node_modules / dist / ローカル生成物
└── README.md                     # セットアップ・開発・デプロイ手順、iPhoneでの「ホーム画面に追加」手順
```

## ディレクトリ・主要ファイルの役割

| パス | 役割 | 対応する `functional-design.md` のコンポーネント |
|---|---|---|
| `index.html` / `src/main.jsx` / `src/App.jsx` | アプリの起動、Service Worker 登録、画面切り替え | 画面UI層 |
| `src/views/` | 画面単位のコンポーネント（日別 / 月別 / フォーム / オーバーレイ / メニュー） | 画面UI層・カレンダー表示・予定確認フォーム |
| `src/components/` | 複数画面で使う入力部品・表示部品 | 画面UI層 |
| `src/speech/` | ブラウザ音声認識の開始・停止・結果取得・エラー処理の抽象化 | 音声入力コンポーネント |
| `src/parser/` | 認識テキストから日時・タイトル候補を推測 | 日時推測エンジン |
| `src/parser/rules/` | 日付・時刻・期間それぞれの抽出ルール（対応表現の追加単位） | 日時推測エンジン |
| `src/store/` | IndexedDB への CRUD、書き出し・読み込み、スキーマ管理 | 予定ストア・書き出し / 読み込み |
| `src/domain/` | Event / Settings の生成・バリデーション・既定値（永続化やUIに依存しない純粋ロジック） | 予定確認フォーム（バリデーション）・日時推測エンジン（Settings参照） |
| `src/datetime.js` | 日付の表示整形・曜日計算の共通ヘルパー（`date-fns` ラッパー） | カレンダー表示・日時推測エンジン |
| `src/styles/` | グローバルCSSとテーマ値、コンポーネント別CSS | 画面UI層 |
| `public/` | ビルド時に無加工でコピーされるアイコン等 | PWA（マニフェスト） |
| `vite.config.js` | ビルド設定、`vite-plugin-pwa` による Service Worker・マニフェスト生成 | Service Worker |
| `.github/workflows/deploy.yml` | ビルドと GitHub Pages への公開 | （配信） |

**注**: 実行時の利用者データ（IndexedDB の `koekare` データベース、`navigator.storage` の永続化フラグ）はブラウザ内に保持され、リポジトリには一切含まれない。書き出しファイル（JSON）は利用者が任意の場所へ保存する。

## ファイル配置ルール

- **新しい画面を追加する場合**: `src/views/<Name>View.jsx`（またはフォーム系なら `<Name>Form.jsx`）を作成し、`src/App.jsx` の `view` 切り替えに登録する。画面固有のスタイルは同じ場所に `<Name>View.css` として置く。
- **複数画面で使う部品を追加する場合**: `src/components/` に置く。1画面でしか使わない部品は、その画面ファイルの近く（`src/views/`）に置いてよい。
- **日時推測の対応表現を追加する場合**: `src/parser/rules/` の該当ファイル（日付なら `dateRules.js`、時刻なら `timeRules.js`、期間なら `durationRules.js`）にルールを追加する。`dateTimeParser.js` 本体や他のルールファイルには手を入れないことを原則とする（`product-requirements.md` の保守性NFR「対応表現の追加が他へ影響しにくい構造」に対応）。追加時は必ず `docs/functional-design.md` の対応表も更新する。
- **保存先を変更・追加する場合**（将来のクラウド同期など、MVP対象外）: `src/store/eventStore.js` が公開するインターフェース（`add` / `update` / `delete` / `get` / `list`）を変えずに、別実装を追加する。`src/views/` や `src/components/` は変更しない。
- **音声認識の方式を変更する場合**（将来、外部音声認識APIなど）: `src/speech/speechRecognizer.js` のインターフェース（`start` / `stop` / `onResult` / `onError`）を保ったまま実装を差し替える。
- **設定項目（Settings）を追加する場合**: `src/domain/settings.js` に既定値を追加し、`src/store/settingsStore.js` の読み書きと、参照側（多くは `src/parser/`）を更新する。
- **テストの配置**: テストは対象ファイルと同じディレクトリに `<対象>.test.js`（React コンポーネントは `.test.jsx`）として置く（co-location）。独立した `test/` ミラーディレクトリは作らない。テスト観点の詳細は `docs/development-guidelines.md` の「テスト規約」で定義する。
- **ドキュメント**: 設計判断・仕様の記録はリポジトリ直下の `docs/` に置く。`README.md` には利用者・開発者向けの手順（セットアップ、`npm run dev`、デプロイ、iPhoneでのホーム画面追加）のみを記載する。
- **静的アセット**: アイコン・マニフェスト用画像は `public/` に置く。`src/` から `import` するのは、ビルド時にハッシュ付きファイル名にしたい画像のみとする。

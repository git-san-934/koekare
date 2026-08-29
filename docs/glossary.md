# ユビキタス言語定義

本書はコエカレに関わる用語を定義し、`docs/` 配下の各ドキュメントおよびコード上の命名で表記を統一するためのものである。用語の意味・詳細な仕様は各永続的ドキュメント（`product-requirements.md` / `functional-design.md` / `architecture.md`）を正とし、本書はその要約と対応表を提供する。

## ドメイン用語の定義

| 用語 | 定義 | 詳細定義の所在 |
|---|---|---|
| 予定（Event） | 利用者がカレンダーに登録する1件の出来事。ID・タイトル・開始日時・終了日時・終日フラグ・作成元・作成/更新日時を持つ | `functional-design.md` データモデル定義 |
| タイトル（Title） | 予定の内容を表す短い文字列。空は許可しない | `functional-design.md` |
| 開始日時（Start） | 予定が始まる日時。内部表現はISO 8601（オフセット付き） | `functional-design.md` / `architecture.md` |
| 終了日時（End） | 予定が終わる日時。開始日時以降。未指定時は開始 + 既定の予定長さ | `functional-design.md` |
| 終日（All-day） | 時刻を持たず日付だけで扱う予定であることを示すフラグ | `functional-design.md` |
| 作成元（Source） | その予定が音声から作られたか（`voice`）手入力で作られたか（`manual`）の区別。推測精度の振り返りに用いる | `functional-design.md` / `product-requirements.md` 成功の定義 |
| 設定（Settings） | 既定の予定長さ、「朝／昼／夕方／夜」に割り当てる時刻など、日時推測が参照する調整値の一式。MVPでは編集UIを設けず既定値を使う | `functional-design.md` データモデル定義 |
| 既定の予定長さ（Default duration） | 終了時刻が指定されなかったときに予定に与える長さ（分）。既定60分 | `functional-design.md` |
| 音声入力（Voice input） | マイクボタンを押して発話し、その内容を文字に変換してから予定として登録する一連の操作 | `product-requirements.md` 主要な機能一覧 |
| 音声認識（Speech recognition） | 発話音声を文字列へ変換する処理。ブラウザのWeb Speech APIを用い、ネット接続を要する | `architecture.md` テクノロジースタック |
| 認識テキスト（Transcript） | 音声認識が返した文字列。日時推測エンジンの入力になる | `functional-design.md` 日時推測エンジンの設計 |
| 日時推測（Date-time parsing） | 認識テキストから開始日時・終了日時・タイトル候補を割り出す処理。ルールベース | `functional-design.md` 日時推測エンジンの設計 |
| 推測ルール（Parse rule） | 日付・時刻・期間それぞれの表現を認識テキストから抽出する規則。対応表現の追加単位 | `functional-design.md` 対応範囲の各表 / `repository-structure.md` |
| 予定確認フォーム（Event form） | 予定を保存する前に、推測値または入力値を確認・修正する画面。新規作成と編集の両方に使う | `functional-design.md` 画面構成 |
| 日別ビュー（Day view） | 選択した1日の予定を時系列で並べるホーム画面 | `functional-design.md` 画面構成 |
| 月別ビュー（Month view） | 1か月分のカレンダーで予定のある日を示す画面 | `functional-design.md` 画面構成 |
| 予定ストア（Event store） | 予定の追加・更新・削除・取得・一覧をIndexedDB上で行うコンポーネント。内部インターフェースを持ち差し替え可能 | `functional-design.md` コンポーネント設計 / API設計 |
| 端末内ストレージ（Local storage / IndexedDB） | 予定データを利用者の端末内に保存する仕組み。外部サーバーへは送らない | `architecture.md` テクノロジースタック |
| 書き出し（Export） | 全予定を1つのJSONファイルとして保存すること | `architecture.md` 書き出しファイル形式 |
| 読み込み（Import） | 書き出したJSONファイルから予定を復元すること。検証に失敗した場合は既存データを変更しない | `architecture.md` 書き出しファイル形式 |
| バックアップ（Backup） | 書き出しと読み込みによってデータの喪失に備える運用全体を指す | `product-requirements.md` 主要な機能一覧 |
| スキーマバージョン（Schema version） | 書き出しJSONおよびIndexedDBの構造の版数。読み込み時の互換性判定に使う | `architecture.md` |
| PWA（Progressive Web App） | ブラウザで動くが「ホーム画面に追加」してアプリのように全画面起動でき、オフラインでも起動できるWebアプリの形態 | `architecture.md` |
| アプリシェル（App shell） | オフライン起動のためにService Workerがキャッシュする、アプリ本体の静的ファイル（HTML/CSS/JS）一式 | `architecture.md` / `functional-design.md` システム構成図 |
| Service Worker | 静的ファイルをキャッシュしてオフライン起動を可能にするブラウザの仕組み | `architecture.md` |
| ストレージ永続化（Storage persistence） | ブラウザによる自動削除の対象になりにくくするための `navigator.storage.persist()` 要求。iOSでは保証されない | `architecture.md` データ保存の制約 |

## ビジネス用語の定義

| 用語 | 定義 |
|---|---|
| 利用者 | コエカレのMVPにおける対象ユーザー。開発者本人を含む、iPhoneを日常的に使い、その場で予定を登録したい個人 |
| MVP | Minimum Viable Product。本プロジェクトでは `product-requirements.md` が定義する機能一覧の範囲を指す |
| Non-Goals（対象外） | MVPのスコープから明示的に除外する対象・機能（例: 通知、繰り返し予定、他カレンダー連携、複数端末同期、ネイティブアプリ化） |
| 非機能要件（NFR） | パフォーマンス・可用性・データ信頼性・セキュリティ・互換性・ユーザビリティ・保守性など、機能そのものではない品質特性の要件 |
| ローカル完結 | 利用データを外部サーバーへ送らず、端末内で処理・保存する方針。音声認識時の発話音声のみ例外（`product-requirements.md` プライバシーNFR） |

## UI/UX用語の定義

| 用語 | 定義 |
|---|---|
| マイクボタン | 日別ビューにある、押すと音声入力を始めるボタン（🎤） |
| ＋ボタン | 日別ビューにある、押すと空の予定確認フォームを開くボタン |
| 音声入力オーバーレイ | マイクボタン押下中に表示される、認識中の状態と認識テキストを示す画面 |
| 確認プロンプト | 予定の削除時などに表示される、実行の可否を利用者に尋ねる確認 |
| 日移動／月移動 | 日別ビュー・月別ビューで表示対象の日または月を前後させる操作 |
| ホーム画面に追加 | iPhoneのSafariでWebアプリをホーム画面のアイコンとして登録し、全画面で起動できるようにするiOSの機能 |
| スタンドアロン表示 | ブラウザのアドレスバー等を表示せず全画面でアプリを起動する表示モード（`display: standalone`） |
| セーフエリア | ノッチやホームバーと重ならない画面の安全領域。`env(safe-area-inset-*)` で余白を確保する |

## 英語・日本語対応表

`docs/development-guidelines.md` の命名規則（コード識別子は英語、画面文言は日本語）に基づく対応表。新しい用語を追加する場合は、コードとドキュメントの両方でここに追記した表記に統一する。

| 日本語 | 英語（コード上の識別子） |
|---|---|
| 予定 | Event / `event` |
| タイトル | `title` |
| 開始日時 | `startAt` |
| 終了日時 | `endAt` |
| 終日 | `allDay` |
| 作成元 | `source`（値: `voice` / `manual`） |
| 作成日時 | `createdAt` |
| 更新日時 | `updatedAt` |
| 設定 | Settings / `settings` |
| 既定の予定長さ（分） | `defaultDurationMinutes`（定数 `DEFAULT_DURATION_MINUTES`） |
| 朝／昼／夕方／夜の時刻 | `morningHour` / `noonHour` / `eveningHour` / `nightHour` |
| 音声認識器 | `SpeechRecognizer` / `speechRecognizer.js` |
| 認識テキスト | `transcript` |
| 日時推測（する） | `parseDateTime()` / `dateTimeParser.js` |
| 推測結果 | `{ startAt?, endAt?, title? }`（`ParsedDateTime`） |
| 日付ルール／時刻ルール／期間ルール | `dateRules.js` / `timeRules.js` / `durationRules.js` |
| 正規化 | `normalize()` / `normalize.js` |
| 予定ストア | `eventStore` / `eventStore.js` |
| 設定ストア | `settingsStore` / `settingsStore.js` |
| データベース定義 | `db.js`（DB名 `koekare`、ストア `events` / `settings`、インデックス `by_start`） |
| 書き出し | `exportEvents()` / `backup.js` |
| 読み込み | `importEvents()` / `backup.js` |
| スキーマバージョン | `schemaVersion` |
| 日別ビュー | `DayView` / `DayView.jsx` |
| 月別ビュー | `MonthView` / `MonthView.jsx` |
| 予定確認フォーム | `EventForm` / `EventForm.jsx` |
| 音声入力オーバーレイ | `VoiceOverlay` / `VoiceOverlay.jsx` |
| メニュー／バックアップ画面 | `BackupMenu` / `BackupMenu.jsx` |
| マイクボタン | `MicButton` / `MicButton.jsx` |
| 現在表示中の画面 | `view`（値: `day` / `month` / `form` / `backup`） |
| 日時表示ヘルパー | `datetime.js` |

## コード上の命名規則との関係

一般的な命名スタイル（camelCase／PascalCase／ケバブケース／スネークケース／ファイル名規則等）は `docs/development-guidelines.md` の「命名規則」節で定義済みであり、本書はそれを前提として上記対応表の英語表記を「正」として扱う。ドメイン用語とコード識別子の対応に齟齬が生じた場合は、本書を更新して一致させる。

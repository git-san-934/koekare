# 技術仕様書

本書は `docs/product-requirements.md` の非機能要件、および `docs/functional-design.md` で「詳細は `architecture.md` で定義する」とされた項目（音声認識の実現方式、データ保存方式、書き出しファイル形式、PWA構成）を確定する。

## テクノロジースタック

| 領域 | 選定 | 選定理由 |
|---|---|---|
| 言語・ランタイム | JavaScript (ESM) / Node.js 22 LTS（開発時のみ） | 型システム導入コストを避けるためTypeScriptはMVPでは採用しない。実行環境はブラウザのため、Nodeはビルド・テスト時にのみ使用する。 |
| UIライブラリ | React 19 | 日別/月別カレンダーやフォームの状態管理を宣言的に書け、`docs/functional-design.md` の画面遷移をコンポーネント分割で表現しやすい。エコシステムが広く、実装・保守の情報が得やすい。JSXは自動ランタイム（`react/react-in-jsx-scope` は無効化）。 |
| ビルドツール | Vite（実装時点で v8） | 開発サーバーが速く、PWA・React向けの設定が最小限で済む。静的ファイル（HTML/CSS/JS）を出力するだけなので配信先を選ばない。 |
| ルーティング | 画面数が少ないため専用ライブラリを使わず、Reactの状態による画面切り替え（`view` state）で実装 | 依存を1つ減らす。日別/月別/フォーム/メニューの4系統のみで、URL単位の共有要件もない（`product-requirements.md` プライバシーNFR「予定内容をURLに残さない」にも沿う）。 |
| 音声認識 | Web Speech API（`SpeechRecognition` / `webkitSpeechRecognition`）、`lang = 'ja-JP'` | ブラウザ標準機能で追加費用・バックエンド不要。iOS 14.5以降のSafariで利用可能。認識器は `SpeechRecognizer` インターフェースで抽象化し、将来別方式へ差し替え可能にする（下記「技術的制約」参照）。 |
| 日時の推測 | 自作のルールベースパーサー（正規表現による抽出）＋ 日付計算に `date-fns` | `docs/functional-design.md` の対応表（「来週の月曜」「今週末」「朝/昼/夜」等）は既存ライブラリ（chrono-node等）の日本語対応では賄いきれず、挙動が予測しづらい。抽出ロジックは自作し、日付の加減算・曜日計算など間違えやすい部分だけ `date-fns` に任せる。 |
| 端末内ストレージ | IndexedDB、ラッパーに `idb`（軽量・Promiseベース） | 予定1,000件規模でもインデックス付きの範囲検索が高速。`localStorage` と違いトランザクションで部分書き込みを防げ、`product-requirements.md` のデータ信頼性NFRを満たす。 |
| 書き出しファイル形式 | JSON（独自スキーマ、`schemaVersion` フィールドを持つ） | 全項目を欠損なく往復（書き出し→読み込み）でき、検証も容易。人間が中身を確認でき、他ツールやスクリプトでも扱える。iCalendar(.ics)書き出しは将来の拡張とする（下記）。 |
| PWA | `vite-plugin-pwa`（内部でWorkbox）でService Worker生成とWebアプリマニフェスト管理 | アプリ本体（HTML/CSS/JS）をプリキャッシュしてオフライン起動を実現（`product-requirements.md` 可用性NFR）。設定がVite設定ファイルに集約され保守しやすい。 |
| スタイリング | プレーンCSS（CSSカスタムプロパティでテーマ値を管理）、コンポーネント単位のCSSファイル | UIフレームワークを入れず依存とバンドルサイズを抑える。スマホ片手操作前提のシンプルな画面のため、ユーティリティCSSフレームワークの必要性が低い。 |
| 配信 | 静的ホスティング（HTTPS必須）。第一候補: GitHub Pages（GitHub Actionsでビルド・デプロイ） | Service WorkerとWeb Speech APIはHTTPS（またはlocalhost）でのみ動作する。無料でカスタムビルド不要。最終的な配信先は `.steering/` の実装作業で確定する。 |

### 依存パッケージ（MVP想定・確定は実装時）

| パッケージ | 用途 |
|---|---|
| `react` / `react-dom` | UI |
| `date-fns` | 日付の加減算・曜日・フォーマット |
| `idb` | IndexedDBのPromiseラッパー |
| `vite` / `@vitejs/plugin-react` | ビルド・開発サーバー |
| `vite-plugin-pwa` | Service Worker・マニフェスト |
| `vitest` / `@testing-library/react` / `@testing-library/user-event` / `jsdom` | テスト |
| `fake-indexeddb` | テスト時の IndexedDB 実装（`vitest.setup.js` で読み込み） |
| `oxlint` | Lint |

テストの既定環境は `node`（純粋ロジック・ストア用、高速）。React コンポーネントのテストは各ファイル先頭に `// @vitest-environment jsdom` を付ける。

外部の音声認識・カレンダー同期のSaaS、状態管理ライブラリ（Redux等）、UIコンポーネントライブラリはMVPでは導入しない。

## 開発ツールと手法

- **Lint**: oxlint。設定 `.oxlintrc.json` をリポジトリルートに配置する（旧 `task-manager/` の方針を踏襲: セミコロンなし・シングルクォート・インデント2スペース。詳細規約は `docs/development-guidelines.md` で確定）。
- **テスト**: Vitest
  - 日時推測パーサーの単体テスト（`docs/functional-design.md` の対応表の各行を、実行日を固定したうえでケース化する。「今日」「明日」「来週の月曜」「◯月◯日の過去日→翌年」「◯時半」「午後3時」「10時から11時」「1時間」「終日」など）
  - 予定ストアの単体テスト（`fake-indexeddb` で add/update/delete/get/list、範囲検索、読み込み時の検証失敗で既存データが変更されないこと）
  - 予定確認フォームのコンポーネントテスト（タイトル未入力で保存不可、`endAt < startAt` で保存不可、推測値の初期表示）
  - 音声入力コンポーネントは `SpeechRecognizer` をモックに差し替えてテスト（実マイク・実ネットワークに依存しない）
- **フォーマッタ**: oxlintの整形ルールを使用
- **ローカル動作確認**: `npm run dev`（Vite開発サーバー、PC Chrome）。iPhone実機確認は同一LAN内で `vite --host` を使うか、デプロイ先のHTTPS URLをSafariで開く
- **コミット規約・ブランチ運用**: `docs/development-guidelines.md` で定義する
- **デプロイ**: GitHub Actions（`.github/workflows/deploy.yml`）で `main` へのpush時に lint → test → `npm run build` → 成果物（`dist/`）を GitHub Pages へ公開
  - **ベースパス**: `vite.config.js` の `BASE_PATH` 定数（既定 `'/claude-code-book-template/'`）。GitHub Pages のプロジェクトサイト用。リポジトリ名変更時、またはカスタムドメイン（`'/'`）に切り替える際はこの1行を修正する
  - **初回のみ手作業**: リポジトリの Settings → Pages → Source を「GitHub Actions」に設定する

## 技術的制約と要件

### 対応環境

- **主対象**: iOS Safari 最新版および1つ前のメジャーバージョン（`product-requirements.md` の対応環境NFRに対応）
- **副次対象**: PC Google Chrome 最新版（開発・確認用）
- **HTTPS必須**: Service Worker・Web Speech API・マイク利用はセキュアコンテキスト（HTTPSまたはlocalhost）でのみ動作する。配信は必ずHTTPSで行う
- **「ホーム画面に追加」対応**: Webアプリマニフェストで `display: standalone`、`lang: ja`、テーマカラー、各サイズのアイコン、`apple-touch-icon` を用意する。`viewport-fit=cover` とCSSの `env(safe-area-inset-*)` でノッチ・ホームバーを避ける

### 音声認識（Web Speech API）の制約と対処

- **ネットワーク必須**: iOS/多くのブラウザで認識はサーバー側で行われる。オフライン時は認識を開始せず「ネット接続が必要です」と表示し手入力へ誘導する（`product-requirements.md` 可用性NFR）
- **ユーザー操作が必要**: 認識開始はタップ等のユーザージェスチャー内で呼ぶ。初回はマイク許可ダイアログが出る
- **発話音声の送信**: 認識時、発話音声がブラウザを通じてOS/ブラウザの音声認識サービスへ送られる。この点を初回利用時に説明する（`product-requirements.md` プライバシーNFR）
- **実装差・不安定性**: iOS Safariの `SpeechRecognition` はバージョンにより挙動差・不具合がある。無音タイムアウト・認識エラー・`not-allowed`（許可拒否）を捕捉し、いずれの場合も予定確認フォームを開いて手入力を継続できるようにする（行き止まりを作らない）
- **抽象化**: `SpeechRecognizer` インターフェース（`start()` / `stop()` / `onResult` / `onError`）を定義し、Web Speech API実装をその背後に置く。将来 `MediaRecorder` ＋ 外部音声認識API（バックエンド・費用が必要なためMVP対象外）へ差し替えられるようにする

### データ保存（IndexedDB）の制約と対処

- **データベース構成**: DB名 `koekare`、オブジェクトストア `events`（keyPath `id`）、インデックス `by_start`（`startAt`）。`settings` ストアは単一レコード（key固定）
- **書き込みの一貫性**: 追加・更新・削除および読み込み時の一括登録は単一トランザクションで行う。読み込みは「全レコードを検証 → 検証通過後に1トランザクションで反映」の順とし、検証失敗時は一切書き込まない（`product-requirements.md` データ信頼性NFR）
- **ストレージ永続化**: 初回に `navigator.storage.persist()` を要求し、ブラウザによる自動削除の対象になりにくくする。ただしiOSでは保証されないため、定期的な書き出しを利用者に促すUIを設ける（`product-requirements.md` の書き出し機能で対応）
- **スキーマ変更**: IndexedDBの `onupgradeneeded` でバージョン管理する。マイグレーション手順は変更時に `docs/functional-design.md` へ追記する

### 書き出しファイル形式（JSON）

```json
{
  "app": "koekare",
  "schemaVersion": 1,
  "exportedAt": "2026-08-29T10:00:00+09:00",
  "events": [
    {
      "id": "…",
      "title": "打ち合わせ",
      "startAt": "2026-08-30T15:00:00+09:00",
      "endAt": "2026-08-30T16:00:00+09:00",
      "allDay": false,
      "source": "voice",
      "createdAt": "…",
      "updatedAt": "…"
    }
  ]
}
```

- 読み込み時の検証: トップレベルの `app === "koekare"`、`schemaVersion` が対応範囲内、`events` が配列、各要素の必須項目（`id` / `title` / `startAt` / `endAt`）と型・日時妥当性（`endAt >= startAt`）をチェックする
- 検証失敗時はエラー表示のみで既存データを変更しない
- ファイル保存はブラウザのダウンロード（`Blob` + `a[download]`）、読み込みは `<input type="file">` で行う
- iCalendar（.ics）での書き出しは、他カレンダーへの取り込み用途として将来検討する（MVP対象外）

### その他

- **タイムゾーン**: 端末のローカルタイムゾーンで扱う。日時は内部的にISO 8601（オフセット付き）で保持する。複数タイムゾーンをまたぐ利用はMVPでは考慮しない
- **言語**: UI文言・音声認識（`ja-JP`）・日時推測はすべて日本語のみ対象（`product-requirements.md` スコープ）

## パフォーマンス要件

- **音声入力の応答**: マイクボタン押下から録音開始まで体感即座（1秒以内目安）。発話終了から推測結果がフォームに入るまで通常のネット環境で3秒以内目安（`product-requirements.md` パフォーマンスNFR）。うち日時推測処理自体は数ミリ秒で完了する見込み（ルールベース・対象は1文）
- **カレンダー表示**: 予定1,000件規模でも日別・月別の表示切り替えが滑らかであること。`events` の `by_start` インデックスで表示範囲（当日 / 当月）だけを範囲検索し、全件をメモリ展開しない
- **初回読み込み**: バンドルは分割不要な規模を見込むが、`dist` の初回転送量が大きくならないよう依存を最小限に保つ。2回目以降はService Workerのプリキャッシュから起動する
- **起動時間**: ホーム画面起動時、Service Workerキャッシュヒット時はネットワーク待ちなしで初期画面（日別ビュー）を表示する

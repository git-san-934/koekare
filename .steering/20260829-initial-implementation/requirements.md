# 初回実装 要求内容

## 本作業の目的

コエカレのMVP（`docs/product-requirements.md` が定義する機能一覧）を、iPhoneのSafariで「ホーム画面に追加」して日常利用できる状態まで一括で実装する。これはリポジトリ最初のアプリ実装であり、既存アプリコードはない（旧プロジェクトは削除済み）。

## 今回追加する機能

`docs/product-requirements.md` の「主要な機能一覧（MVPスコープ）」の全項目を対象とする。実装は下記の順序で段階的に進める（各段階の詳細タスクは `tasklist.md`）。

| 段階 | 内容 | 対応する恒久ドキュメント |
|---|---|---|
| 1. 土台 | Vite + React プロジェクト初期化、フォルダ構成、Lint、テスト基盤、`index.html`（iOS向けメタ） | `architecture.md` / `repository-structure.md` |
| 2. データ層 | `Event` / `Settings` のドメインロジックと IndexedDB 実装（`eventStore` / `settingsStore` / `db`） | `functional-design.md` データモデル / `architecture.md` データ保存 |
| 3. 表示 | 日別ビュー・月別ビュー、画面切り替え（`App.jsx` の `view` state） | `functional-design.md` 画面構成 |
| 4. 手入力フロー | 予定確認フォーム（新規・編集・削除）、＋ボタンからの導線、バリデーション | `functional-design.md` 画面構成 / 主要フローのシーケンス |
| 5. 日時推測 | `normalize` + 日付／時刻／期間ルール + `parseDateTime`。対応表現は `functional-design.md` の3表に準拠 | `functional-design.md` 日時推測エンジンの設計 |
| 6. 音声入力 | `SpeechRecognizer`（Web Speech API 実装）、音声入力オーバーレイ、マイクボタン、失敗時の手入力フォールバック | `architecture.md` 音声認識の制約と対処 |
| 7. バックアップ | JSON 書き出し・読み込み（検証つき）、メニュー画面 | `architecture.md` 書き出しファイル形式 |
| 8. PWA・配信 | `vite-plugin-pwa` でマニフェスト・Service Worker、アイコン、`navigator.storage.persist()`、GitHub Actions デプロイ | `architecture.md` PWA / 配信 |

## ユーザーストーリー（本作業でカバーするもの）

`docs/product-requirements.md` の全ユーザーストーリーを対象とする。特に本作業の完了判断で重視するのは以下。

- 利用者として、マイクボタンを押して「明日の15時から打ち合わせ」と話すだけで、日時とタイトルが入った状態の確認フォームが開き、保存できる。
- 利用者として、音声がうまく認識されなくても、その場で手入力して予定を登録できる。
- 利用者として、登録した予定を日別・月別で見返し、タップして修正・削除できる。
- 利用者として、アプリを閉じて開き直しても予定が残っており、機内モードでも閲覧・編集できる。
- 利用者として、予定を1ファイルに書き出し、そのファイルから復元できる。

## 受け入れ条件

`docs/product-requirements.md` の「受け入れ条件」全項目を満たすこと。加えて本作業固有の完了条件として:

- [ ] `npm run dev` でPC Chromeから全画面の操作（手入力での予定CRUD、日別/月別切り替え、書き出し/読み込み）が一通り行える
- [ ] `npm run build` が成功し、`dist/` を静的配信した状態で Service Worker が登録され、2回目以降オフラインで起動できる
- [ ] GitHub Actions により `main` への push で GitHub Pages（HTTPS）へ自動デプロイされる
- [ ] デプロイ先URLを iPhone Safari で開き「ホーム画面に追加」→ アイコンから全画面起動し、音声入力で1件登録できる（実機確認）
- [ ] `npm run lint` と `npm test` がグリーン
- [ ] 日時推測パーサーのテストが `docs/functional-design.md` の日付・時刻・期間の対応表の各行をカバーしている
- [ ] 予定ストアのテストで「読み込みJSONの検証失敗時に既存データが変更されない」ことを確認している

## 制約事項

- `docs/architecture.md` で確定した技術スタックに従う（React + Vite、JavaScript、IndexedDB(`idb`)、Web Speech API、`date-fns`、`vite-plugin-pwa`、oxlint、Vitest）。新規の主要依存を追加する場合は `design.md` で理由を明記する
- `docs/product-requirements.md` の「MVP対象外」項目（通知、繰り返し予定、場所・メモ等の追加項目、他カレンダー連携、複数端末同期、オフライン音声認識、多言語対応）は実装しない。ただし将来追加を妨げない拡張点（`eventStore` インターフェース、`SpeechRecognizer` インターフェース、`parser/rules/` 分割、`Settings` データ構造）は今回用意する
- 予定データおよび発話内容を、音声認識サービス以外の外部へ送信しない
- 音声認識の実機挙動（iOS Safari のバージョン差・不具合）に依存する部分は、失敗時に必ず手入力で継続できることを優先し、認識の完全性は完了条件にしない
- アプリ名は暫定「コエカレ」。確定前でも `db.js` のDB名・マニフェストの `name` は `koekare` を用いる（後からの表示名変更が容易なため）
- 作業単位のドキュメント（本ステアリング）で基本設計に変更が生じた場合は、該当する `docs/` を更新してから実装を続ける

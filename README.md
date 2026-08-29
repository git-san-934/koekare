# コエカレ

音声で予定を入力できるカレンダーアプリ（ブラウザで動く PWA）。

マイクボタンを押して「明日の15時から会議」のように話すと、日時とタイトルを推測して
確認フォームに入力します。予定はこの端末の中だけに保存され、外部には送信されません。

- 設計ドキュメント: [`docs/`](docs/)
- 今回の実装計画: [`.steering/20260829-initial-implementation/`](.steering/20260829-initial-implementation/)

## 必要環境

- Node.js 22 以上
- 音声入力を使うには、対応ブラウザ（iOS Safari 14.5 以降 / PC Chrome など）とネット接続が必要です。
  音声が使えない環境でも、手入力ですべての操作ができます。

## 開発

```bash
npm install
npm run dev      # 開発サーバー（http://localhost:5173/claude-code-book-template/）
npm test         # テスト（Vitest）
npm run lint     # Lint（oxlint）
npm run build    # 本番ビルド（dist/）
npm run preview  # ビルド結果をローカルで確認
```

iPhone 実機で確認する場合は `npm run dev -- --host` で同一 LAN からアクセスするか、
デプロイ先の HTTPS URL を Safari で開きます（音声認識・Service Worker は HTTPS が必須）。

## デプロイ（GitHub Pages）

`main` ブランチへ push すると、GitHub Actions（[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)）が
lint・テスト・ビルドを実行し、GitHub Pages へ公開します。

初回のみ、リポジトリの **Settings → Pages → Build and deployment → Source** を
**GitHub Actions** に設定してください。

公開 URL は `https://<ユーザー名>.github.io/claude-code-book-template/` です。
リポジトリ名を変更した場合は [`vite.config.js`](vite.config.js) の `BASE_PATH` を合わせて変更します。

## iPhone で使う（ホーム画面に追加）

1. Safari で公開 URL を開く
2. 共有ボタン →「ホーム画面に追加」
3. 追加されたアイコンから起動すると、全画面で立ち上がります
4. 一度起動すれば、予定の閲覧・追加・編集はオフラインでも可能です（音声入力のみネット接続が必要）

## データについて

- 予定はブラウザ内（IndexedDB）に保存され、サーバーには送信されません。
- iOS では、長期間使わないとブラウザがデータを削除することがあります。
  メニューの「すべての予定を書き出す」で定期的にバックアップしてください。
- 機種変更時は、書き出したファイルを新しい端末の「ファイルから読み込む」で復元できます。

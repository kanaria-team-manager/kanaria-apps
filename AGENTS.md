# リポジトリガイドライン

## プロジェクト概要（Overview）

- `/doc/architecture.md`を参照すること。
- `/doc/knowledge.md`を参照すること。
  - 必要に応じてこのドキュメントは更新すること。

## コーディング規約（Coding Style Guidelines）

- biomeの設定を参考にすること
- 開発はt_wadaが言っているようなTDD手法で実行すること

## セキュリティ（Security considerations）

- APIキーや認証情報の扱い方、依存関係の脆弱性管理、通信方式、入力値検証の必須ルールなどを記載すること。

## ビルド＆テスト手順（Build & Test）

- セットアップ手順、ビルドコマンド、テスト実行方法、CI/CDでのチェック内容を記載すること。
- backendのテストに関しては [TESTING.md](./packages/backend/TESTING.md) を参照すること。

## 知識＆ライブラリ（Knowledge & Library）

- svelteに関する情報は `https://svelte.jp/docs/llms` から取得すること
- supabaseに関する情報は公式ドキュメントの最新版を参照すること
- 常に最新の情報を取得してから思考を開始すること

## メンテナンス_ポリシー（Maintenance policy）

- 会話の中で繰り返し指示されたことがある場合は反映を検討すること
- 冗長だったり、圧縮の余地がある箇所を検討すること
- 簡潔でありながら密度の濃い文書にすること
---
description: ブラウザでAIがUIと動作を確認するためのワークフロー（開発テストユーザーでのログイン含む）
---

## 目的
Antigravity（AIエージェント）が、ローカル環境で保護されたルーティング（`/dashboard` 等）やUIの変更をブラウザサブエージェントを使って目視で確認するための手順です。

## 前提事項
ローカルでSupabaseとDevサーバーが起動できる状態であること。

## 手順

// turbo
1. Supabaseのステータスを確認
```bash
supabase status
```
※ もし起動していない場合は `nix develop --command bash -c "supabase start"` を実行してください。

// turbo
2. テスト用ユーザーの作成（または作成済みか確認）
```bash
nix develop --command bash -c "pnpm seed:dev-user"
```
（このコマンドで `dev@kanaria.local` のユーザーがSupabase Authおよび `public.users` に追加/確認されます。パスワードはスクリプト実行結果に表示されます。）

// turbo
3. フロントエンド・バックエンドのDevサーバーをバックグラウンドで起動
```bash
nix develop --command bash -c "pnpm dev" &
while ! curl -s http://localhost:5173/auth/login > /dev/null; do sleep 1; done
```

4. ブラウザサブエージェント（`browser_subagent`）による検証の実行
認証が必要な画面を確認する場合、以下の流れで Task を指定してください。

**Subagent Task (Prompt) の例:**
```text
Navigate to http://localhost:5173/auth/login.
Fill in the email "dev@kanaria.local" and the password from DEV_USER_PASSWORD (or provided password parameter).
Click the login button.
Wait for the redirect to /dashboard.
(ここに検証したい具体的な動作や確認ポイントを追記。例：ウィンドウ幅をモバイルサイズに変えてドロワーが開くか確認するなど)
Return a detailed report of what you observed.
```

// turbo-all
5. サーバープロセスの終了（任意）
検証が終わったら、必要に応じてプロセスの終了を行ってください。

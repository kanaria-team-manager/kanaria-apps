# Nixファイル構成ガイド

## 現在の構成

```
kanaria/
├── flake.nix          ← すべての構成をここに記述
├── flake.lock
├── .gitignore
└── packages/
```

### 使用方法

```bash
# Nix shell起動（PostgreSQL自動起動）
nix develop

# PostgreSQL接続確認
psql -h .postgres -p 54322 -U postgres kanaria_test

# テスト実行
cd packages/backend
pnpm test

# DB操作
db-reset    # テストDB再構築
db-console  # psqlコンソール
db-stop     # PostgreSQL停止
```

### 環境変数

```bash
DATABASE_URL=postgresql://postgres@localhost:54322/kanaria_test
PGPORT=54322
PGHOST=$PWD/.postgres
```

### トラブルシューティング

**Q: PostgreSQLが起動しない**
```bash
# ログ確認
cat .postgres/logfile

# 手動起動
pg_ctl -D .postgres-data -l .postgres/logfile start
```

**Q: ポート競合**
```bash
# 既存のPostgreSQLを確認
lsof -i :54322

# flake.nixのPGPORTを変更
```

**Q: データベースリセットしたい**
```bash
rm -rf .postgres-data .postgres
nix develop  # 再初期化
```

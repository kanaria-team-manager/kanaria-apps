# Repository Tests Guide

## 📋 Overview

Repositoryテストは**実際のPostgreSQL**（Nix flake提供）を使用し、**Supabase Authのみモック**します。

## 🎯 アーキテクチャ

```
┌─────────────────────────────────────┐
│ Repository Tests                    │
├─────────────────────────────────────┤
│ ✅ Real PostgreSQL (Nix flake)      │
│    - 完全な SQL 実行                │
│    - RLS サポート                   │
│    - トランザクション               │
│    - 本番環境と100%一致             │
│                                     │
│ ✅ Mock: Supabase Auth のみ         │
│    - authMiddleware                 │
│    - SupabaseClient.auth.*          │
└─────────────────────────────────────┘
```

## 🚀 使い方

### 1. Nix Shellで起動

```bash
# PostgreSQL自動起動
nix develop

# または direnvを使用
direnv allow
cd /path/to/kanaria  # 自動起動
```

### 2. テスト実行

```bash
cd packages/backend

# 全Repositoryテスト
pnpm test src/db/repositories

# 特定のRepository
pnpm test src/db/repositories/LabelRepository.test.ts

# ウォッチモード
pnpm test:watch src/db/repositories
```

### 3. データベース操作

```bash
# テストDBリセット
db-reset

# psqlコンソール
db-console

# PostgreSQL停止
db-stop
```

## 📝 テストの書き方

### Repository Test Example

```typescript
import { beforeEach, describe, expect, it } from "vitest";
import { LabelRepository } from "./LabelRepository.js";
import { useTestDb } from "../test-helper.js";

describe("LabelRepository", () => {
  // ✅ 実PostgreSQL接続
  const getDb = useTestDb();
  let repository: LabelRepository;

  beforeEach(() => {
    // 各テスト前に自動クリーンアップ
    repository = new LabelRepository(getDb());
  });

  it("should create a label", async () => {
    const label = await repository.create({
      teamId: "test-team",
      name: "Test",
      color: "#FF0000",
    });

    expect(label.name).toBe("Test");
    
    // 実際のDBに保存されている
    const found = await repository.findById(label.id);
    expect(found).toBeDefined();
  });
});
```

### Endpoint Test Example（将来用）

```typescript
import { describe, it, vi } from "vitest";
import { mockAuthMiddleware } from "../../test/test-utils.js";

describe("POST /labels", () => {
  beforeEach(() => {
    // ✅ Supabase Authのみモック
    vi.mock('../../middleware/auth.js', () => ({
      authMiddleware: mockAuthMiddleware('user-123'),
    }));
  });

  it("should create label", async () => {
    // Repository層は実PostgreSQL使用
    const res = await app.request('/labels', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', color: '#FF0000' }),
    });

    expect(res.status).toBe(201);
  });
});
```

## 🔧 Helper Functions

### `useTestDb()` - Repository Tests

```typescript
export function useTestDb() {
  beforeAll(async () => {
    await setupTestDb();  // PostgreSQL接続
  });

  beforeEach(async () => {
    await cleanupTestData();  // テーブル全削除
  });

  afterAll(async () => {
    await teardownTestDb();  // 接続終了
  });

  return () => testDb;
}
```

**特徴:**
- ✅ 各テスト前に全テーブルTRUNCATE
- ✅ テスト隔離保証
- ✅ マイグレーション自動実行

### `mockAuthMiddleware()` - Endpoint Tests

```typescript
export function mockAuthMiddleware(
  userId: string,
  email: string = "test@example.com"
) {
  return vi.fn(async (c: any, next: any) => {
    c.set("user", { id: userId, email });
    await next();
  });
}
```

## ⚙️ 環境変数

```bash
# 自動設定（nix develop時）
DATABASE_URL=postgresql://postgres@localhost:54322/kanaria_test
PGPORT=54322
PGHOST=$PWD/.postgres
```

## 🐛 トラブルシューティング

### テストがskipされる

```
❯ LabelRepository.test.ts (10 tests | 10 skipped)
Error: DATABASE_URL not set
```

**解決策:**
```bash
# Nix shellで実行
nix develop
pnpm test
```

### PostgreSQLが起動しない

```bash
# ログ確認
cat .postgres/logfile

# 手動起動
pg_ctl -D .postgres-data -l .postgres/logfile \
  -o "-k $PWD/.postgres -p 54322" start
```

### テストデータが残る

**原因:** `beforeEach`でクリーンアップしていない

**解決策:** `useTestDb()`を使用

### ポート競合

```bash
# 既存のPostgreSQLを確認
lsof -i :54322

# flake.nixのPGPORTを変更
```

## 📊 テスト統計

現在のカバレッジ:

| Repository | Tests | Status |
|------------|-------|--------|
| LabelRepository | 10 | ✅ |
| TagRepository | 6 | ✅ |
| TeamRepository | 4 | ✅ |
| UserRepository | 5 | ✅ |

**合計:** 25 tests

## 🎓 設計原則

### なぜ実DBを使うのか？

1. ✅ **正確性**: SQL構文、制約、トリガーを正確にテスト
2. ✅ **RLS**: Row Level Securityの動作確認
3. ✅ **本番再現**: 本番環境と100%一致
4. ✅ **バグ検出**: モックでは見逃すバグを発見

### なぜSupabase Authのみモックか？

1. ✅ **単純性**: 認証設定が複雑（SMTP, OAuth等）
2. ✅ **焦点**: Repositoryテストは「認証後」のロジックに集中
3. ✅ **高速**: 外部サービス不要
4. ✅ **再現性**: 認証エラーも簡単にシミュレート

## 📚 関連ファイル

- `flake.nix` - PostgreSQL設定
- `src/db/test-helper.ts` - DB接続・クリーンアップ
- `src/test/test-utils.ts` - Supabase Authモック
- `NIX_SETUP.md` - Nix環境詳細

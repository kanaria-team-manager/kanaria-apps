# バックエンド テストガイド

## 🎯 テスト戦略と基本方針

本プロジェクトでは**信頼性**と**速度**を重視し、ハイブリッドなアプローチを採用しています：

| テスト層 | データベース | Supabase Auth | 目的 |
|----------|------------|---------------|------|
| **Repository** | ✅ **Real** | ⚠️ **Mock** | データの正確性、SQL制約、RLSの保証。 |
| **Route** | ⚠️ **Mock** | ⚠️ **Mock** | HTTPレスポンス、バリデーション、認証チェック、エラーハンドリングの検証。 |
| **Service** | ⚠️ **Mock** | ⚠️ **Mock** | ビジネスロジックのテスト（該当する場合）。 |

### Repository層で実DBを使う理由
- **正確性**: 実際のPostgresの挙動（外部キー、トリガー、制約）をテストできます。これらはモックでは見落とされがちです。
- **速度**: Nix/Pgliteを介したローカルの一時的なPostgresインスタンスを使用するため、ほぼ瞬時に動作します。
- **分離**: 各テストスイートはトランザクション内で実行されるか、高速なtruncateを使用します。

### Route層でモックを使う理由
- **速度**: DBセットアップのオーバーヘッドなしで効率的に実行できます。
- **焦点**: SQLなどの「実装」ではなく、HTTPという「インターフェース」に焦点を当てます。
- **制御**: Repository層をモック化することで、エッジケース（例：DB接続エラー）のシミュレーションが容易になります。

---

## 🚀 セットアップと使用方法

### 1. 環境セットアップ
テスト環境は**Nix**によって完全に管理されています。

```bash
# Nixシェルを起動（Postgresが自動的に起動します）
nix develop
# または direnvを使用している場合
direnv allow
```

### 2. テストの実行

```bash
cd packages/backend

# 全てのテストを実行
pnpm test

# 特定のレイヤーのみ実行
pnpm test src/db/repositories  # Repositoryテストのみ
pnpm test src/routes           # Routeテストのみ

# 特定のファイルを実行
pnpm test src/routes/labels/labels.test.ts
```

### 3. データベース管理（Repositoryテスト用）
Nixシェルで利用可能なヘルパーコマンド：
- `db-reset`: テストデータベースをリセット（状態が破損した場合に便利）
- `db-console`: `psql`シェルを開く
- `db-stop`: Postgresインスタンスを手動で停止

---

## 📝 テストの書き方

### 1. Repositoryテスト
接続とクリーンアップには `useTestDb` を使用します。**Supabase Authはモック化されます**。

```typescript
import { beforeEach, describe, expect, it } from "vitest";
import { LabelRepository } from "./LabelRepository.js";
import { useTestDb, TEST_TEAMS } from "../../test-helper.js";

describe("LabelRepository", () => {
  const getDb = useTestDb(); // 接続とグローバルクリーンアップを処理

  it("should create label", async () => {
    const repo = new LabelRepository(getDb());
    const label = await repo.create({
      teamId: TEST_TEAMS[0].id, // 共有テストチームを使用
      name: "Test Label",
      color: "#FF0000"
    });
    expect(label).toBeDefined();
  });
});
```

### 2. Routeテスト
**全てをモック化します**（Repository、Auth、DBコンテキスト）。

```typescript
import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { myRoute } from "./my-route.js";
import { mockDbContext, mockEnv, injectMockDb } from "../../test/test-utils.js";

// 1. Repositoryのモック化
const mockMethod = vi.fn();
vi.mock("../../db/repositories/MyRepository.js", () => ({
  MyRepository: class {
    find = mockMethod;
  },
}));

// 2. Authのモック化
vi.mock("../../middleware/auth.js", () => ({
  authMiddleware: async (c: any, next: any) => {
    c.set("user", { id: "user-123", email: "test@example.com" });
    await next();
  },
}));

describe("GET /my-route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return 200", async () => {
    mockMethod.mockResolvedValue({ id: 1 });
    
    // 3. Honoにモックを設定
    const app = new Hono();
    app.use("*", injectMockDb(mockDbContext()));
    app.route("/my-route", myRoute);

    const res = await app.fetch(new Request("http://localhost/my-route"), mockEnv());
    expect(res.status).toBe(200);
  });
});
```

---

## 🛠️ テストユーティリティ

`src/test/` および `src/db/` に配置されています：

| ヘルパー | ファイル | 目的 |
|--------|------|---------|
| `useTestDb()` | `src/db/test-helper.ts` | **Repo Tests**: 実DBに接続し、グローバルセットアップされたチームを利用します。 |
| `TEST_TEAMS` | `src/db/test-helper.ts` | **Repo Tests**: グローバルセットアップで作成された共有チームID。 |
| `mockDbContext()` | `src/test/test-utils.ts` | **Route Tests**: HonoのDBコンテキストとトランザクションをモック化します。 |
| `injectMockDb()` | `src/test/test-utils.ts` | **Route Tests**: モックDBを注入するミドルウェア。 |
| `mockEnv()` | `src/test/test-utils.ts` | **Route Tests**: ダミーの環境変数を提供します。 |
| `mockSupabaseClient()` | `src/test/test-utils.ts` | **Route Tests**: Supabase Admin/Authクライアントをモック化します。 |

---

## 📊 現在のステータス (2026年1月)

**総合カバレッジ: ~98% 合格 (49/50)**

- ✅ **Repository Tests**: 96% 合格 (実DB)
  - Team, User, Tag Repository: 100%
  - LabelRepository: 90% (1つのテストで軽微なデータクリーンアップの問題があるが、ブロッキングではない)
- ✅ **Route Tests**: 100% 合格 (モック化)
  - カバー範囲: Auth, Teams (Create/Verify/Activate), Labels, Places, Players, Tags.

---

## ⚠️ よくある落とし穴

1.  **Repositoryテスト**: `drizzle-orm` や `postgres` をモック化**しないでください**。`useTestDb` が提供する本物の接続を使用してください。
2.  **Routeテスト**: DBに接続しようと**しないでください**。常に `vi.mock` を使用してRepositoryクラスをモック化してください。
3.  **グローバルセットアップ**: テストチームは `src/test/global-setup.ts` で全テストの前に**一度だけ**作成されます。テスト内でこれらを削除しないでください。

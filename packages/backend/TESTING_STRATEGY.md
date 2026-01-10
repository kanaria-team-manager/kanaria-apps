# Backend Testing Strategy

## テスト階層と方針

### 原則
1. **テストピラミッド**: Unit > Integration > E2E の順で数を減らす
2. **高速実行**: 開発フローを妨げない
3. **信頼性**: 本番環境に近い条件でテスト
4. **Mock最小限**: 本物を使えるところは使う

---

## 1. Repository Tests (Unit) ✅ 実装済み

**対象**: `src/db/repositories/*.ts`

| 要素 | 実装 | 理由 |
|------|------|------|
| **Database** | ✅ Real (Nix PostgreSQL) | データベース操作の正確性を保証 |
| **Supabase Auth** | ⚠️ Mock | Repository層は認証を扱わない |
| **外部API** | N/A | Repository層は外部APIを呼ばない |

**テスト項目**:
- ✅ CRUD操作の正確性
- ✅ Foreign Key制約の検証
- ✅ トランザクション処理
- ✅ システムフラグ処理
- ✅ Team ownership検証

**実行方法**:
```bash
pnpm --filter backend test src/db/repositories
```

**現状**: 24/25 tests passing (96%)

---

## 2. Service Layer Tests (Unit) 🔄 推奨事項

**対象**: `src/services/*.ts` (もし実装する場合)

| 要素 | 実装 | 理由 |
|------|------|------|
| **Repository** | ⚠️ Mock | Service層のロジックのみをテスト |
| **Supabase Auth** | ⚠️ Mock | 認証ロジックと分離 |
| **外部API** | ⚠️ Mock | ネットワークI/Oを排除 |
| **Database** | ❌ No | Repositoryを通さない |

**テスト項目**:
- ビジネスロジックの検証
- バリデーションルール
- エラーハンドリング
- データ変換・整形
- 複数Repositoryの協調処理

**推奨Mock方法**:
```typescript
import { vi } from 'vitest';
import type { LabelRepository } from '../db/repositories/LabelRepository.js';

describe('LabelService', () => {
  let mockLabelRepo: LabelRepository;
  
  beforeEach(() => {
    mockLabelRepo = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as any;
  });
});
```

---

## 3. Route/Controller Tests (Unit) 🔄 推奨事項

**対象**: `src/routes/*.ts`, `src/controllers/*.ts`

| 要素 | 実装 | 理由 |
|------|------|------|
| **Repository** | ⚠️ Mock (推奨) | HTTPレイヤーの責務のみテスト |
| **Service** | ⚠️ Mock (もしあれば) | 同上 |
| **Supabase Auth** | ⚠️ Mock | `src/test/test-utils.ts`を使用 |
| **Database** | ❌ No | 下層をMock |

**テスト項目**:
- HTTPステータスコード
- レスポンスボディ形式
- 認証・認可チェック
- リクエストバリデーション
- エラーレスポンス形式
- CORS設定
- レート制限

**推奨Mock方法**:
```typescript
import { mockSupabaseAuth } from '../test/test-utils.js';
import type { LabelRepository } from '../db/repositories/LabelRepository.js';

describe('POST /api/labels', () => {
  let mockLabelRepo: LabelRepository;
  
  beforeEach(() => {
    mockSupabaseAuth({
      userId: 'test-user-id',
      teamId: 'test-team-id',
    });
    
    mockLabelRepo = {
      create: vi.fn().mockResolvedValue({ id: '123', name: 'Test' }),
    } as any;
  });
  
  it('should create label and return 201', async () => {
    const response = await request(app)
      .post('/api/labels')
      .send({ name: 'Test', color: '#FF0000' });
      
    expect(response.status).toBe(201);
    expect(mockLabelRepo.create).toHaveBeenCalled();
  });
});
```

**利点**:
- ✅ 高速実行
- ✅ DBセットアップ不要
- ✅ HTTPレイヤーの責務に集中
- ✅ Repository層は別途テスト済み

---

## 4. Integration Tests 🔄 推奨事項

**対象**: 複数層にまたがる機能フロー

| 要素 | 実装 | 理由 |
|------|------|------|
| **Repository** | ✅ Real | 実際のDB操作を検証 |
| **Service** | ✅ Real | ビジネスロジックを含む |
| **Supabase Auth** | ⚠️ Mock | 外部サービスは制御 |
| **Database** | ✅ Real (Nix PostgreSQL) | データ整合性を検証 |

**テスト項目**:
- エンドツーエンドのビジネスフロー
- トランザクションの整合性
- 複数Repositoryの協調動作
- 実際のSQL制約の動作確認

**実行方法**:
```bash
pnpm --filter backend test:integration
```

**推奨ファイル配置**:
```
src/
  test/
    integration/
      label-workflow.test.ts
      user-registration.test.ts
```

---

## 5. E2E Tests 🔄 推奨事項

**対象**: フロントエンドからバックエンドまでの完全なフロー

| 要素 | 実装 | 理由 |
|------|------|------|
| **Repository** | ✅ Real | すべて本物 |
| **Service** | ✅ Real | すべて本物 |
| **Supabase Auth** | ✅ Real (Staging) | 本番に近い環境 |
| **Database** | ✅ Real (Staging) | 本番に近い環境 |
| **Frontend** | ✅ Real (Playwright) | ユーザー視点 |

**テスト項目**:
- ユーザーシナリオ
- 画面遷移
- データの永続化
- エラー時の挙動
- パフォーマンス

**実行方法**:
```bash
pnpm test:e2e
```

---

## テスト実行速度の目安

| テスト種別 | 実行時間 | 頻度 |
|-----------|---------|------|
| Repository | ~2秒 | コミット毎 |
| Route/Controller | <1秒 | コミット毎 |
| Service | <1秒 | コミット毎 |
| Integration | ~5秒 | PR毎 |
| E2E | ~30秒 | デプロイ前 |

---

## Mock vs Real 判断基準

### Mock を使うべき場合
- ❌ ネットワークI/O (外部API, Supabase Auth)
- ❌ ファイルシステムI/O
- ❌ テスト対象外の下層
- ❌ 時間・ランダム性に依存する処理

### Real を使うべき場合
- ✅ Database (Nix PostgreSQLで高速)
- ✅ テスト対象の層とその直下
- ✅ 状態整合性が重要な処理

---

## 既存のテストユーティリティ

### 1. `src/db/test-helper.ts`
Repository tests用:
```typescript
import { useTestDb, TEST_TEAMS } from '../db/test-helper.js';

const getDb = useTestDb(); // Global setupで共通チーム作成済み
```

### 2. `src/test/test-utils.ts`
Supabase Auth mock用:
```typescript
import { mockSupabaseAuth, mockSupabaseClient } from './test-utils.js';

mockSupabaseAuth({ userId: '123', teamId: 'team-1' });
```

### 3. `src/test/global-setup.ts`
Vitest Global Setup:
- テストDB初期化
- 共通テストチーム作成

---

## 次のステップ

### 優先度: 高
1. [ ] Route/Controller testsの実装
   - `src/routes/*.test.ts` を作成
   - Repository をMock
   - HTTPレスポンスを検証

### 優先度: 中
2. [ ] Service layer testsの実装 (もしService層があれば)
   - `src/services/*.test.ts` を作成
   - Repository をMock
   - ビジネスロジックを検証

### 優先度: 低
3. [ ] Integration testsの実装
   - `src/test/integration/*.test.ts` を作成
   - すべてReal (Auth以外)
   - フロー全体を検証

---

## まとめ

| テスト層 | DB | Repository | Supabase Auth | 目的 |
|---------|----|-----------| -------------|------|
| **Repository** | ✅ Real | N/A | ⚠️ Mock | データ操作の正確性 |
| **Service** | ❌ No | ⚠️ Mock | ⚠️ Mock | ビジネスロジック |
| **Route** | ❌ No | ⚠️ Mock | ⚠️ Mock | HTTPレイヤー |
| **Integration** | ✅ Real | ✅ Real | ⚠️ Mock | フロー全体 |
| **E2E** | ✅ Real | ✅ Real | ✅ Real | ユーザー視点 |

**推奨**: Route層では**RepositoryをMock**し、HTTPレイヤーの責務のみをテストする。Repositoryの動作は別途Repository testsで保証済み。

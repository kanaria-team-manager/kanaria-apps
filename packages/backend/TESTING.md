# Backend Testing Guide

## 🎯 Testing Strategy & Philosophy

This project prioritizes **Reliability** and **Speed** using a hybrid approach:

| Test Layer | Database | Supabase Auth | Purpose |
|------------|----------|---------------|---------|
| **Repository** | ✅ **Real** | ⚠️ **Mock** | Ensure data correctness, SQL constraints, and RLS. |
| **Route** | ⚠️ **Mock** | ⚠️ **Mock** | Verify HTTP responses, validation, auth checks, and error handling. |
| **Service** | ⚠️ **Mock** | ⚠️ **Mock** | Test business logic (if applicable). |

### Why Real DB for Repositories?
- **Accuracy**: Tests actual Postgres behavior (foreign keys, triggers, constraints) which mocks often miss.
- **Speed**: We use a local ephemeral Postgres instance via Nix/Pglite, which is nearly instant.
- **Isolation**: Each test suite runs in a transaction or uses fast truncation.

### Why Mock for Routes?
- **Speed**: Route tests run efficiently without DB setup overhead.
- **Focus**: Tests focus on the *Interface* (HTTP), not the *Implementation* (SQL).
- **Control**: Easier to simulate edge cases (e.g., DB connection failures) by mocking the repository layer.

---

## 🚀 Setup & Usage

### 1. Environment Setup
The testing environment is fully managed by **Nix**.

```bash
# Start the Nix shell (starts Postgres automatically)
nix develop
# OR if using direnv
direnv allow
```

### 2. Running Tests

```bash
cd packages/backend

# Run ALL tests
pnpm test

# Run specific layers
pnpm test src/db/repositories  # Repository tests only
pnpm test src/routes           # Route tests only

# Run specific file
pnpm test src/routes/labels/labels.test.ts
```

### 3. Database Management (for Repository Tests)
Helper commands available in Nix shell:
- `db-reset`: Reset the test database (useful if state gets corrupted)
- `db-console`: Open `psql` shell
- `db-stop`: Stop the Postgres instance manually

---

## 📝 Writing Tests

### 1. Repository Tests
Use `useTestDb` to handle connection and cleanup. **Supabase Auth is mocked**.

```typescript
import { beforeEach, describe, expect, it } from "vitest";
import { LabelRepository } from "./LabelRepository.js";
import { useTestDb, TEST_TEAMS } from "../../test-helper.js";

describe("LabelRepository", () => {
  const getDb = useTestDb(); // Handles connection & global cleanup

  it("should create label", async () => {
    const repo = new LabelRepository(getDb());
    const label = await repo.create({
      teamId: TEST_TEAMS[0].id, // Use shared test team
      name: "Test Label",
      color: "#FF0000"
    });
    expect(label).toBeDefined();
  });
});
```

### 2. Route Tests
**Mock everything** (Repositories, Auth, DB Context).

```typescript
import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { myRoute } from "./my-route.js";
import { mockDbContext, mockEnv, injectMockDb } from "../../test/test-utils.js";

// 1. Mock Repository
const mockMethod = vi.fn();
vi.mock("../../db/repositories/MyRepository.js", () => ({
  MyRepository: class {
    find = mockMethod;
  },
}));

// 2. Mock Auth
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
    
    // 3. Setup Hono with Mocks
    const app = new Hono();
    app.use("*", injectMockDb(mockDbContext()));
    app.route("/my-route", myRoute);

    const res = await app.fetch(new Request("http://localhost/my-route"), mockEnv());
    expect(res.status).toBe(200);
  });
});
```

---

## 🛠️ Test Utilities

Located in `src/test/`:

| Helper | File | Purpose |
|--------|------|---------|
| `getTestDb()` | `src/test/setup.ts` | **Repo Tests**: Returns DB connection for the test file. |
| `TEST_TEAMS` | `src/test/global-setup.ts` | **Repo Tests**: Shared team IDs created once in global setup. |
| `mockDbContext()` | `src/test/test-utils.ts` | **Route Tests**: Mocks Hono DB context & transaction. |
| `injectMockDb()` | `src/test/test-utils.ts` | **Route Tests**: Middleware to inject mock DB. |
| `mockEnv()` | `src/test/test-utils.ts` | **Route Tests**: Provides dummy environment variables. |
| `mockSupabaseClient()` | `src/test/test-utils.ts` | **Route Tests**: Mocks Supabase Admin/Auth client. |

### Test Setup Architecture

Vitest uses a two-tier setup:

1. **Global Setup** (`src/test/global-setup.ts`): Runs **once** before all tests
   - Ensures test database exists
   - Runs migrations
   - Truncates all tables
   - Creates test teams (shared across all tests)
   - Returns teardown function to clean up after all tests

2. **Setup Files** (`src/test/setup.ts`): Runs **before each test file**
   - Establishes DB connection for that test file
   - Exports `getTestDb()` and `TEST_TEAMS` for tests to use
   - Closes connection after all tests in the file complete

---

## 📊 Current Status (Jan 2026)

**Total Coverage: ~98% Passing (49/50)**

- ✅ **Repository Tests**: 96% Passing (Real DB)
  - Team, User, Tag Repositories: 100%
  - LabelRepository: 90% (Minor data cleanup issue in one test, non-blocking)
- ✅ **Route Tests**: 100% Passing (Mocked)
  - Covered: Auth, Teams (Create/Verify/Activate), Labels, Places, Players, Tags.

---

## ⚠️ Common Pitfalls

1.  **Repository Tests**: Do NOT mock `drizzle-orm` or `postgres`. Use the real connection provided by `getTestDb()`.
2.  **Route Tests**: Do NOT try to connect to the DB. Always mock the Repository class using `vi.mock`.
3.  **Global Setup**: Test teams are created *once* before all tests in `src/test/global-setup.ts`. Do not delete or modify them in your tests.
4.  **Test Isolation**: Each test file gets its own DB connection, but shares the same database instance. Clean up test data within your tests if needed.

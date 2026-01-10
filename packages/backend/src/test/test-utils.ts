import { vi } from "vitest";
import type { Context } from "hono";

/**
 * Mock Supabase Auth middleware for endpoint tests
 * Use this when testing API routes that require authentication
 *
 * Usage:
 *   vi.mock('../../middleware/auth.js', () => ({
 *     authMiddleware: mockAuthMiddleware('user-123'),
 *   }));
 */
export function mockAuthMiddleware(
  userId: string,
  email: string = "test@example.com",
  teamId?: string,
  roleId: number = 0
) {
  return vi.fn(async (c: any, next: any) => {
    c.set("user", {
      id: userId,
      email,
      aud: "authenticated",
      role: "authenticated",
    });
    
    // If teamId is provided, also set userRecord
    if (teamId) {
      c.set("userRecord", {
        id: userId,
        teamId,
        roleId,
      });
    }
    
    await next();
  });
}

/**
 * Mock Supabase client for service-level tests
 * Use this when testing code that directly calls Supabase client
 */
export function mockSupabaseClient(options: {
  getUserById?: (id: string) => Promise<any>;
  updateUserById?: (id: string, data: any) => Promise<any>;
} = {}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "test-user-id",
            email: "test@example.com",
          },
        },
        error: null,
      }),
      admin: {
        getUserById: options.getUserById || vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "test-user-id",
              email: "test@example.com",
              app_metadata: {},
              user_metadata: {},
            },
          },
          error: null,
        }),
        updateUserById: options.updateUserById || vi.fn().mockResolvedValue({
          error: null,
        }),
      },
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
  };
}

/**
 * Create a mock database transaction
 * Executes callback immediately without actual transaction
 */
export function mockDbTransaction() {
  return vi.fn(async (callback: (tx: any) => Promise<void>) => {
    await callback({});
  });
}

/**
 * Create a mock database context for Hono
 * For injecting into Hono context in tests
 */
export function mockDbContext(transaction = mockDbTransaction()) {
  return {
    transaction,
  };
}

/**
 * Create mock environment variables for tests
 */
export function mockEnv(overrides: Record<string, string> = {}) {
  return {
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    SUPABASE_URL: "http://mock.supabase.io",
    SUPABASE_SERVICE_ROLE_KEY: "mock-service-role-key",
    SUPABASE_JWT_SECRET: "mock-jwt-secret",
    FRONTEND_URL: "http://localhost:5173",
    ...overrides,
  };
}

/**
 * Helper to inject mock DB into Hono context
 * Usage in tests:
 *   app.use('*', injectMockDb(mockDbContext()));
 */
export function injectMockDb(mockDb: any) {
  return async (c: Context, next: () => Promise<void>) => {
    c.set("db", mockDb);
    await next();
  };
}

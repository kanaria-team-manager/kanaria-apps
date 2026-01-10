import { vi } from "vitest";

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
  email: string = "test@example.com"
) {
  return vi.fn(async (c: any, next: any) => {
    c.set("user", {
      id: userId,
      email,
      aud: "authenticated",
      role: "authenticated",
    });
    await next();
  });
}

/**
 * Mock Supabase client for service-level tests
 * Use this when testing code that directly calls Supabase client
 */
export function mockSupabaseClient() {
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

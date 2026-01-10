import { afterAll, beforeAll, beforeEach } from "vitest";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as schema from "./schemas/index.js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

export let testDb: PostgresJsDatabase<typeof schema>;
let testClient: postgres.Sql;
let teamsCreated = false; // Track if test teams have been created

/**
 * Common test team IDs used across all repository tests
 * These teams are created once before all tests
 */
export const TEST_TEAMS = {
  MAIN: "test-team-main",
  ALPHA: "test-team-alpha",
  BETA: "test-team-beta",
  GAMMA: "test-team-gamma",
  UPDATE: "test-team-update",
  DELETE: "test-team-delete",
  PROTECTED: "test-team-protected",
  ORIGINAL: "test-team-original",
  DIFFERENT: "test-team-different",
  WRONG: "test-team-wrong",
} as const;

/**
 * Setup test database connection
 * Uses Nix flake's local PostgreSQL
 */
export async function setupTestDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "❌ DATABASE_URL not set.\n" +
        "Make sure you're running tests in nix shell:\n" +
        "  nix develop\n" +
        "  pnpm test"
    );
  }

  testClient = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  testDb = drizzle(testClient, { schema });

  // Run migrations
  await migrate(testDb, {
    migrationsFolder: "./drizzle",
  });

  return testDb;
}

/**
 * Teardown test database connection
 */
export async function teardownTestDb() {
  if (testClient) {
    await testClient.end();
  }
}

/**
 * Clean all test data from database
 * Ensures test isolation
 * Tables are truncated in dependency order (children first, then parents)
 * NOTE: Teams are NOT truncated as they are shared across all tests
 */
export async function cleanupTestData() {
  // Truncate in correct order: children first, then parents
  // NOTE: Do NOT truncate teams - they are created once and reused
  await testDb.execute(sql`
    TRUNCATE TABLE 
      attendances,
      labelables,
      taggables,
      events,
      players,
      labels,
      tags,
      places,
      users
    RESTART IDENTITY CASCADE
  `);
}

/**
 * Create common test teams used across all repository tests
 * Only creates teams once, even if called multiple times
 * Handles race conditions when multiple test files run in parallel
 */
export async function createTestTeams() {
  // Skip if already created
  if (teamsCreated) {
    return;
  }

  const teamData = Object.entries(TEST_TEAMS).map(([key, id]) => ({
    id,
    name: key,
    code: id,
    status: 1,
    eventSequence: 0,
  }));

  for (const team of teamData) {
    try {
      await testDb.insert(schema.teams).values(team);
    } catch (error: unknown) {
      // Ignore duplicate key errors (happens when multiple test files run in parallel)
      const isPostgresError = error && typeof error === 'object' && 'code' in error;
      if (!isPostgresError || (error as {code?: string}).code !== '23505') {
        throw error;
      }
      // Silently ignore duplicate key constraint violations
    }
  }

  teamsCreated = true;
}

/**
 * Hook for Repository tests
 * - Uses real PostgreSQL (from Nix flake)
 * - Test teams created in global setup (shared across all tests)
 * - Cleans non-team data between each test for isolation
 * - No Supabase Auth (Repositories don't need it)
 *
 * Usage:
 *   const getDb = useTestDb();
 *   let repo: LabelRepository;
 *
 *   beforeEach(() => {
 *     repo = new LabelRepository(getDb());
 *   });
 */
export function useTestDb() {
  beforeAll(async () => {
    await setupTestDb();
    // NOTE: Teams are created in global setup
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  return () => testDb;
}

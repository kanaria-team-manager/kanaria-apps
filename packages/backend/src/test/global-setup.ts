/**
 * Vitest Global Setup
 * Runs ONCE before all test files
 * 
 * Responsibilities:
 * - Validate DATABASE_URL configuration
 * - Ensure test database exists (create if needed)
 * - Create DB connection
 * - Run migrations
 * - Create shared test teams
 * - Clean up on teardown
 */

import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../db/schemas/index.js";

// Shared DB connection (used across all tests)
export let testDb: PostgresJsDatabase<typeof schema>;
let testClient: postgres.Sql;

/**
 * Common test team IDs used across all repository tests
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
 * Ensure test database exists, create if needed
 */
async function ensureTestDatabase(connectionString: string) {
  // Parse database name from connection string
  const url = new URL(connectionString);
  const dbName = url.pathname.slice(1); // Remove leading '/'

  if (!dbName) {
    throw new Error("Database name not found in connection string");
  }

  // Connect to 'postgres' database to check/create test database
  const adminUrl = new URL(connectionString);
  adminUrl.pathname = "/postgres";

  const adminClient = postgres(adminUrl.toString(), { max: 1 });

  try {
    // Check if database exists
    const result = await adminClient<[{ exists: boolean }]>`
      SELECT EXISTS(
        SELECT FROM pg_database WHERE datname = ${dbName}
      ) as exists
    `;

    if (!result[0].exists) {
      console.log(`📦 Creating test database: ${dbName}`);
      await adminClient.unsafe(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database created: ${dbName}`);
    } else {
      console.log(`✅ Database exists: ${dbName}`);
    }
  } finally {
    await adminClient.end();
  }
}

export async function setup() {
  console.log("🔧 Global Setup: Initializing test environment...");

  // Validate DATABASE_URL
  const connectionString = process.env.TEST_DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "❌ TEST_DATABASE_URL not set.\n" +
        "Make sure you're running tests with vitest:\n" +
        "  pnpm test",
    );
  }

  console.log(`📊 Connecting to: ${connectionString}`);

  // Ensure test database exists
  await ensureTestDatabase(connectionString);

  // Create DB connection (shared across all tests)
  testClient = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  testDb = drizzle(testClient, { schema });

  // Run migrations
  console.log("📦 Running migrations...");
  await migrate(testDb, {
    migrationsFolder: "./drizzle",
  });

  // Clean all existing data
  console.log("🧹 Cleaning test database...");
  await testDb.execute(sql`
    TRUNCATE TABLE 
      attendances,
      taggables,
      events,
      players,
      labels,
      tags,
      places,
      users,
      teams
    RESTART IDENTITY CASCADE
  `);

  // Create shared test teams
  console.log("👥 Creating shared test teams...");
  const teamData = Object.entries(TEST_TEAMS).map(([key, id]) => ({
    id,
    name: key,
    code: id,
    status: 1,
    eventSequence: 0,
  }));

  for (const team of teamData) {
    await testDb.insert(schema.teams).values(team);
  }

  console.log(`✅ Created ${teamData.length} test teams`);
  console.log("✅ Global Setup complete\n");
}

export async function teardown() {
  console.log("🧹 Global Teardown: Cleaning up...");

  if (testDb) {
    // Optional: Clean all data on teardown
    await testDb.execute(sql`
      TRUNCATE TABLE 
        attendances,
        taggables,
        events,
        players,
        labels,
        tags,
        places,
        users,
        teams
      RESTART IDENTITY CASCADE
    `);
  }

  if (testClient) {
    await testClient.end();
  }

  console.log("✅ Teardown complete");
}

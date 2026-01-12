/**
 * Vitest Global Setup
 * Runs once before all tests across all workers
 *
 * Responsibilities:
 * - Ensure test database exists
 * - Run migrations
 * - Clean all tables
 * - Create test teams (once for all tests)
 */

import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../db/schemas/index.js";

/**
 * Common test team IDs
 * These are created once in global setup and available to all tests
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
 * Ensure test database exists
 */
async function ensureTestDatabase(connectionString: string) {
  const url = new URL(connectionString);
  const dbName = url.pathname.slice(1);

  if (!dbName) {
    throw new Error("Database name not found in connection string");
  }

  const adminUrl = new URL(connectionString);
  adminUrl.pathname = "/postgres";
  const adminClient = postgres(adminUrl.toString(), { max: 1 });

  try {
    const result = await adminClient<[{ exists: boolean }]>`
      SELECT EXISTS(
        SELECT FROM pg_database WHERE datname = ${dbName}
      ) as exists
    `;

    if (!result[0].exists) {
      await adminClient.unsafe(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await adminClient.end();
  }
}

/**
 * Global setup function
 * Runs once before all tests
 */
export default async function setup() {
  const connectionString = process.env.TEST_DATABASE_URL;

  if (!connectionString) {
    throw new Error("TEST_DATABASE_URL not set");
  }

  console.log("🔧 Running global test setup...");

  // Ensure database exists
  await ensureTestDatabase(connectionString);

  // Create connection for setup
  const client = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  const db: PostgresJsDatabase<typeof schema> = drizzle(client, { schema });

  try {
    // Run migrations
    console.log("📦 Running migrations...");
    await migrate(db, {
      migrationsFolder: "./drizzle",
    });

    // Clean all tables
    console.log("🧹 Cleaning tables...");
    await db.execute(sql`
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

    // Create test teams
    console.log("👥 Creating test teams...");
    const teamData = Object.entries(TEST_TEAMS).map(([key, id]) => ({
      id,
      name: key,
      code: id,
      status: 1,
      eventSequence: 0,
    }));

    for (const team of teamData) {
      await db.insert(schema.teams).values(team);
    }

    console.log("✅ Global test setup complete");
  } finally {
    await client.end();
  }

  // Return teardown function
  return async () => {
    console.log("🧹 Running global test teardown...");
    const teardownClient = postgres(connectionString, { max: 1 });
    const teardownDb: PostgresJsDatabase<typeof schema> = drizzle(
      teardownClient,
      { schema },
    );

    try {
      // Clean up after all tests
      await teardownDb.execute(sql`
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
      console.log("✅ Global test teardown complete");
    } finally {
      await teardownClient.end();
    }
  };
}

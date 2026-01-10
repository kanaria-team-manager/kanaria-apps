/**
 * Vitest Global Setup
 * Runs once before all test files
 * Creates shared test teams that all repository tests depend on
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";
import * as schema from "../db/schemas/index.js";

// Import TEST_TEAMS constant
const TEST_TEAMS = {
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

export async function setup() {
  console.log('🔧 Global Setup: Initializing test database...');

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "❌ DATABASE_URL not set.\n" +
        "Make sure you're running tests in nix shell:\n" +
        "  nix develop\n" +
        "  pnpm test"
    );
  }

  const client = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  const db = drizzle(client, { schema });

  // Run migrations
  await migrate(db, {
    migrationsFolder: "./drizzle",
  });

  // Clean all existing data
  console.log('🧹 Cleaning test database...');
  await db.execute(sql`
    TRUNCATE TABLE 
      attendances,
      labelables,
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
  console.log('👥 Creating shared test teams...');
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

  console.log(`✅ Created ${teamData.length} test teams`);

  // Close connection
  await client.end();

  console.log('✅ Global Setup complete\n');
}

export async function teardown() {
  console.log('🧹 Global Teardown: Cleaning up...');
  // Optional: Add any global cleanup here
}

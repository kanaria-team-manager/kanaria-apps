import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Load .dev.vars
config({ path: ".dev.vars" });

// Set TEST_DATABASE_URL from DATABASE_URL
if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    "❌ TEST_DATABASE_URL is not set.\n" +
      "Make sure Supabase Local is running:\n" +
      "  supabase-start\n" +
      "  pnpm run env:generate",
  );
}

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    globalSetup: ["./src/test/global-setup.ts"],
    setupFiles: ["./src/test/setup.ts"],
  },
});

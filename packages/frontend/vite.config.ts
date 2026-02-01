import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";

import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  test: {
    expect: { requireAssertions: true },
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,ts}"],
    exclude: ["src/lib/server/**", "src/**/*.server.{test,spec}.{js,ts}"],
    setupFiles: ["./src/vitest-setup.ts"],
    server: {
      deps: {
        inline: ["@sveltejs/kit"],
      },
    },

  },
  resolve: {
    conditions: ["browser"],
  },
  // プロキシ設定を削除
  // APIコールはサーバーサイド(+page.server.ts)からPUBLIC_BACKEND_URLを使用して行う
});

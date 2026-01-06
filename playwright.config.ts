import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5173', // Frontend URL
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 重要: 両方のサーバーを起動する
  webServer: [
    {
      command: 'pnpm --filter backend dev',
      url: 'http://localhost:8787', // Backend URL
      reuseExistingServer: !process.env.CI,
      timeout: 10 * 1000,
    },
    {
      command: 'pnpm --filter frontend dev',
      url: 'http://localhost:5173', // Frontend URL
      reuseExistingServer: !process.env.CI,
      timeout: 10 * 1000,
    },
  ],
});
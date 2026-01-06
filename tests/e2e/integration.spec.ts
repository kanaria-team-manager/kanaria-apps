import { expect, test } from '@playwright/test';

test.describe('Full Stack Integration', () => {
  test('"/"へのアクセスで"/auth/login"へリダイレクトされる', async ({ page }) => {
    // Frontend にアクセス
    await page.goto('/');

    await page.waitForURL("http://localhost:5173/auth/login");
    
    // ログインページにリダイレクトされているか確認
    await expect(page.url()).toBe("http://localhost:5173/auth/login");
  });
});
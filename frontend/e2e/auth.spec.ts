import { test, expect, Page } from '@playwright/test';

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
}

test.describe('Authentication', () => {
  test('buyer logs in and sees Browse with note cards', async ({ page }) => {
    await login(page, 'rohan.kumar@email.com', 'Test@1234');
    await expect(page).toHaveURL(/\/browse/);
    await expect(page.getByRole('heading', { name: 'Browse notes' })).toBeVisible();
    await expect(page.locator('.note-card').first()).toBeVisible();
  });

  test('admin lands on the platform dashboard', async ({ page }) => {
    await login(page, 'admin@topnotes.com', 'Admin@123');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Platform overview' })).toBeVisible();
  });

  test('seller lands on the seller dashboard', async ({ page }) => {
    await login(page, 'aarav.patel@email.com', 'Test@1234');
    await expect(page).toHaveURL(/\/seller\/dashboard/);
  });

  test('invalid credentials show an inline error and stay on /login', async ({ page }) => {
    await login(page, 'rohan.kumar@email.com', 'wrong-password');
    await expect(page.locator('.alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

import { test, expect, Page } from '@playwright/test';

async function loginAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('admin@topnotes.com');
  await page.getByLabel('Password', { exact: true }).fill('Admin@123');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);
}

test.describe('Admin', () => {
  test.beforeEach(async ({ page }) => loginAdmin(page));

  test('users page lists accounts in a table', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    await expect(page.locator('table.tn tbody tr').first()).toBeVisible();
  });

  test('verifications page renders cards or the empty state', async ({ page }) => {
    await page.goto('/admin/verifications');
    await expect(page.locator('.verif-cards, .empty').first()).toBeVisible();
  });

  test('test manager loads the config tab', async ({ page }) => {
    await page.goto('/admin/test');
    await expect(page.getByRole('button', { name: 'Test Config' })).toBeVisible();
    await page.getByRole('button', { name: 'Questions' }).click();
    await expect(page.getByRole('button', { name: 'Add question' })).toBeVisible();
  });
});

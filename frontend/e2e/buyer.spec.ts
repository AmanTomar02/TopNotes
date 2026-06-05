import { test, expect } from '@playwright/test';

test('a new buyer can register, browse and purchase a note', async ({ page }) => {
  const email = `e2e_${Date.now()}@test.local`;

  // Register (fresh account → clean purchase state)
  await page.goto('/register');
  await page.locator('.role.student').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Full name').fill('E2E Buyer');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Test@1234');
  await page.getByLabel('Confirm password', { exact: true }).fill('Test@1234');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/browse/);

  // Open the first note
  await page.locator('.note-card').first().click();
  await expect(page).toHaveURL(/\/notes\/\d+/);

  // Purchase it
  await page.getByRole('button', { name: /Buy for/ }).click();
  await expect(page.locator('.toast')).toContainText('Purchase successful');
  await expect(page.getByRole('link', { name: 'Read notes' })).toBeVisible();
});

import { expect, test } from '@playwright/test';
import { column, drag, login, openDemoProject } from './support';

test('logs in with the demo account', async ({ page }) => {
  await login(page);

  await expect(page.getByText('Welcome, Demo User')).toBeVisible();
});

test('creates a task in a column and drags it to another one', async ({ page }) => {
  const title = `E2E task ${Date.now()}`;
  await login(page);
  await openDemoProject(page);

  await page.getByRole('button', { name: 'Add task to To Do' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title').fill(title);
  await dialog.getByRole('button', { name: 'Create Task' }).click();
  await expect(dialog).toBeHidden();

  // Shown at once in its column, without reloading.
  const card = column(page, 'To Do').getByText(title);
  await expect(card).toBeVisible();

  await drag(page, card, column(page, 'In Progress'));
  await expect(column(page, 'In Progress').getByText(title)).toBeVisible();

  // Saved, not only moved on screen.
  await page.reload();
  await expect(column(page, 'In Progress').getByText(title)).toBeVisible();
  await expect(column(page, 'To Do').getByText(title)).toHaveCount(0);
});

test('renews the session with the refresh cookie after a reload', async ({ page }) => {
  await login(page);
  // An unusable access token: the next API call gets a 401 and must refresh.
  await page.evaluate(() => localStorage.setItem('access_token', 'expired'));

  const refresh = page.waitForResponse((r) => r.url().includes('/auth/refresh'));
  await page.goto('/projects');

  expect((await refresh).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
});

test('logs out and protects the app pages', async ({ page }) => {
  await login(page);

  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/projects');
  await expect(page).toHaveURL(/\/login$/);
});

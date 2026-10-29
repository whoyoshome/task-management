import { expect, type Locator, type Page } from '@playwright/test';

export const DEMO_USER = { email: 'demo@example.com', password: 'Password123!' };

export async function login(page: Page, user = DEMO_USER) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'Control Panel' })).toBeVisible();
}

export async function openDemoProject(page: Page) {
  await page.getByRole('link', { name: 'Projects' }).click();
  await page.getByText('Demo Project').first().click();
  await expect(page.getByRole('heading', { name: 'Demo Project' })).toBeVisible();
}

export const column = (page: Page, name: 'To Do' | 'In Progress' | 'Completed') =>
  page.getByRole('region', { name });

/**
 * Drags with real pointer moves: the board starts a drag only after the
 * pointer travels a few pixels, so a plain click still opens the task.
 */
export async function drag(page: Page, item: Locator, target: Locator) {
  const from = await item.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error('Drag source or target is not visible');

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2 + 10, {
    steps: 5,
  });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 });
  await page.mouse.up();
}

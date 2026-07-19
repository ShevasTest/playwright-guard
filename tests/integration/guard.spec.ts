import { test as base } from '@playwright/test';

import { createGuardedTest, expect } from '../../src/index.js';

const test = createGuardedTest(base, {
  attachReport: false,
  failOnIssues: false,
});

test('keeps a healthy page clean', async ({ page, playwrightGuard }) => {
  await page.setContent('<main><h1>Healthy page</h1></main>');

  await expect(page.getByRole('heading', { name: 'Healthy page' })).toBeVisible();
  expect(playwrightGuard.issues).toHaveLength(0);
});

test('observes a real browser console error', async ({ page, playwrightGuard }) => {
  await page.setContent('<main><h1>Observed page</h1></main>');
  await page.evaluate(() => console.error('integration sentinel'));

  expect(playwrightGuard.issues).toContainEqual(
    expect.objectContaining({ kind: 'console', message: 'integration sentinel' }),
  );
});

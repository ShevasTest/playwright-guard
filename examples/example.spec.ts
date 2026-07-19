import { expect, test } from './fixtures.js';

test('home page has no hidden runtime failures', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page.getByRole('heading', { name: 'Example Domain' })).toBeVisible();
});

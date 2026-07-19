import {
  test as defaultBase,
  type Fixtures,
  type Page,
  type TestFixture,
  type TestType,
} from '@playwright/test';

import { RuntimeGuard } from './runtime-guard.js';
import type { GuardFixtures, PlaywrightGuardOptions } from './types.js';

export function createGuardedTest<TestArgs extends { page: Page }, WorkerArgs extends object>(
  base: TestType<TestArgs, WorkerArgs>,
  options: PlaywrightGuardOptions = {},
): TestType<TestArgs & GuardFixtures, WorkerArgs> {
  const fixture: TestFixture<RuntimeGuard, TestArgs & WorkerArgs & GuardFixtures> = async (
    { page },
    use,
    testInfo,
  ) => {
    const guard = new RuntimeGuard(page, options).start();

    try {
      await use(guard);
    } finally {
      guard.stop();
      const report = guard.report();

      if (options.attachReport !== false && (report.issueCount > 0 || report.truncatedCount > 0)) {
        await testInfo.attach('playwright-guard.json', {
          body: Buffer.from(`${JSON.stringify(report, null, 2)}\n`),
          contentType: 'application/json',
        });
      }

      guard.assertNoIssues();
    }
  };

  const fixtures = {
    playwrightGuard: [fixture, { auto: true, box: 'self', title: 'Playwright Guard' }],
  } as unknown as Fixtures<GuardFixtures, object, TestArgs, WorkerArgs>;

  return base.extend<GuardFixtures>(fixtures);
}

export const test = createGuardedTest(defaultBase);

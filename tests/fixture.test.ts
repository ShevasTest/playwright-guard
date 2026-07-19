import type { Page, TestFixture, TestInfo, TestType } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';

import { PlaywrightGuardError } from '../src/error.js';
import { createGuardedTest } from '../src/fixture.js';
import type { RuntimeGuard } from '../src/runtime-guard.js';
import type { GuardFixtures, PlaywrightGuardOptions } from '../src/types.js';
import { consoleMessage, FakePage } from './fakes.js';

type BaseArgs = { page: Page };
type GuardFixture = TestFixture<RuntimeGuard, BaseArgs & GuardFixtures>;
type FixtureEntry = readonly [GuardFixture, Readonly<Record<string, unknown>>];

function captureFixture(options: PlaywrightGuardOptions = {}): GuardFixture {
  let captured: FixtureEntry | undefined;
  const result = {} as TestType<BaseArgs & GuardFixtures, object>;
  const base = {
    extend: (fixtures: unknown) => {
      captured = (fixtures as { playwrightGuard: FixtureEntry }).playwrightGuard;
      return result;
    },
  } as unknown as TestType<BaseArgs, object>;

  expect(createGuardedTest(base, options)).toBe(result);
  expect(captured).toBeDefined();
  return captured![0];
}

function fixtureArgs(page: Page): BaseArgs & GuardFixtures {
  return { page, playwrightGuard: undefined as unknown as RuntimeGuard };
}

describe('createGuardedTest', () => {
  it('attaches a report and fails teardown when an issue is recorded', async () => {
    const fixture = captureFixture();
    const page = new FakePage();
    const attach = vi.fn().mockResolvedValue(undefined);
    const testInfo = { attach } as unknown as TestInfo;

    const run = fixture(
      fixtureArgs(page.asPage()),
      () => {
        page.emit('console', consoleMessage('fixture failure'));
        return Promise.resolve();
      },
      testInfo,
    ) as Promise<void>;

    await expect(run).rejects.toBeInstanceOf(PlaywrightGuardError);
    expect(attach).toHaveBeenCalledOnce();
    expect(attach).toHaveBeenCalledWith(
      'playwright-guard.json',
      expect.objectContaining({ contentType: 'application/json' }),
    );
  });

  it('supports observation without attachment or teardown failure', async () => {
    const fixture = captureFixture({ attachReport: false, failOnIssues: false });
    const page = new FakePage();
    const attach = vi.fn().mockResolvedValue(undefined);

    await fixture(
      fixtureArgs(page.asPage()),
      () => {
        page.emit('console', consoleMessage('observed only'));
        return Promise.resolve();
      },
      { attach } as unknown as TestInfo,
    );

    expect(attach).not.toHaveBeenCalled();
  });

  it('does not attach an empty report', async () => {
    const fixture = captureFixture();
    const attach = vi.fn().mockResolvedValue(undefined);

    await fixture(fixtureArgs(new FakePage().asPage()), () => Promise.resolve(), {
      attach,
    } as unknown as TestInfo);

    expect(attach).not.toHaveBeenCalled();
  });
});

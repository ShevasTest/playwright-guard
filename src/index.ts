export { expect } from '@playwright/test';

export { PlaywrightGuardError, formatGuardFailure } from './error.js';
export { createGuardedTest, test } from './fixture.js';
export { matches } from './matcher.js';
export { createRuntimeGuard, RuntimeGuard } from './runtime-guard.js';
export type {
  ConsoleGuardOptions,
  ConsoleLevel,
  GuardFixtures,
  GuardIssue,
  GuardIssueKind,
  GuardMatcher,
  GuardReport,
  NetworkGuardOptions,
  PageErrorGuardOptions,
  PlaywrightGuardOptions,
  RuntimeGuardApi,
} from './types.js';

import { test as base } from '@playwright/test';
import { createGuardedTest } from '../src/index.js';

export const test = createGuardedTest(base, {
  console: {
    levels: ['error', 'warning'],
    allow: [/ResizeObserver loop/u],
  },
  network: {
    minStatus: 400,
    ignoreResourceTypes: ['image', 'font'],
    allow: [(issue) => issue.status === 404 && issue.url?.endsWith('/optional-feature') === true],
  },
});

export { expect } from '../src/index.js';

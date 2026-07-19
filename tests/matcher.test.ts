import { describe, expect, it } from 'vitest';

import { matches } from '../src/matcher.js';
import type { GuardIssue } from '../src/types.js';

const issue: GuardIssue = {
  kind: 'http-error',
  message: 'Service Unavailable',
  timestamp: '2026-01-01T00:00:00.000Z',
  url: 'https://example.test/api/health',
  method: 'GET',
  resourceType: 'fetch',
  status: 503,
};

describe('matches', () => {
  it('matches strings case-insensitively across issue fields', () => {
    expect(matches(issue, 'SERVICE unavailable')).toBe(true);
    expect(matches(issue, 'api/health')).toBe(true);
    expect(matches(issue, '503')).toBe(true);
    expect(matches(issue, 'checkout')).toBe(false);
  });

  it('matches regular expressions repeatedly, including global expressions', () => {
    const matcher = /example\.test/gu;

    expect(matches(issue, matcher)).toBe(true);
    expect(matches(issue, matcher)).toBe(true);
  });

  it('supports predicate matchers', () => {
    expect(matches(issue, (candidate) => candidate.status === 503)).toBe(true);
    expect(matches(issue, (candidate) => candidate.status === 404)).toBe(false);
  });
});

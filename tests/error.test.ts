import { describe, expect, it } from 'vitest';

import { formatGuardFailure } from '../src/error.js';
import type { GuardIssue, GuardReport } from '../src/types.js';

function report(issues: readonly GuardIssue[], truncatedCount = 0): GuardReport {
  return {
    schemaVersion: 1,
    generatedAt: '2026-01-01T00:00:00.000Z',
    issueCount: issues.length,
    truncatedCount,
    issues,
  };
}

describe('formatGuardFailure', () => {
  it('formats compact issue metadata', () => {
    const message = formatGuardFailure(
      report([
        {
          kind: 'http-error',
          message: 'Internal Server Error',
          timestamp: '2026-01-01T00:00:00.000Z',
          status: 500,
          method: 'POST',
          resourceType: 'fetch',
          url: 'https://example.test/api/orders',
        },
      ]),
    );

    expect(message).toContain('1 unexpected browser issue');
    expect(message).toContain('HTTP 500 · POST · fetch');
  });

  it('limits the inline list and includes retained and truncated overflow', () => {
    const issues: GuardIssue[] = Array.from({ length: 12 }, (_, index) => ({
      kind: 'console',
      message: `error ${index}`,
      timestamp: '2026-01-01T00:00:00.000Z',
    }));

    const message = formatGuardFailure(report(issues, 3));

    expect(message).toContain('… and 5 additional issues.');
    expect(message).not.toContain('error 11');
  });
});
